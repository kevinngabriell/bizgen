"use client";

import Loading from "@/components/loading";
import CustomerLookup from "@/components/lookup/CustomerLookup";
import InquiryLookup from "@/components/lookup/SalesInquiryLookup";
import { AlertMessage } from "@/components/ui/alert";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { GetCustomerData } from "@/lib/master/customer";
import { createSalesQuotation, generateQuotationNumber } from "@/lib/sales/quotation";
import { GetRfq, getDetailSalesRfq } from "@/lib/sales/rfq";
import {Button, Flex, Heading, HStack, Input, Select, SimpleGrid, Stack, Text, Badge, IconButton, Separator, Card, Field, createListCollection, Portal,} from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

type QuotationMode = "create" | "view" | "edit";

export default function Quotation() {
  return (
    <Suspense fallback={<Loading />}>
      <QuotationContent />
    </Suspense>
  );
}

function QuotationContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //retrieve rfq ID
  const searchParams = useSearchParams();
  const quotationID = searchParams.get("quotation_id");

  const [quotationStatus, setQuotationStatus] = useState<string>();
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();
  
  //set mode for create/update/view
  const [mode, setMode] = useState<QuotationMode>("create");
  const isReadOnly = mode === "view" && quotationStatus !== "draft" && quotationStatus !== "rejected";

  //to open customer popup
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<GetCustomerData | null>(null);

  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<GetRfq | null>(null);

  //currency option
  const [currencySelected, setSelected] = useState<string>();
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((cur) => ({
      label: `${cur.currency_name} (${cur.currency_symbol})`,
      value: cur.currency_id,
    })),
  });

  // quotation header state
  const [quotationNo, setQuotationNo] = useState("");
  const [quotationDate, setQuotationDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [linkedInquiry, setLinkedInquiry] = useState("");
  const [linkedInquiryID, setLinkedInquiryID] = useState("");

  //alert & success variable
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const loadMaster = async () => {
      try {
        setLoading(true);

        await init();

        const currencyRes = await getAllCurrency(1, 1000);
        setCurrencyOptions(currencyRes?.data ?? []);

      } catch (err) {
        console.error(err);
      }
    }

    const loadDetail = async () => {
      if (!quotationID) return;
    }

    const loadGeneratedNumber = async () => {
      if (quotationID) return;
    
      try {
        const res = await generateQuotationNumber();
        setQuotationNo(res.number);
      } catch (err) {
        console.error("Failed to generate RFQ number", err);
      }
    };

    const loadAll = async () => {
      try {
        setLoading(true);
        await loadMaster();
        await loadDetail();
        await loadGeneratedNumber();
      } finally {
        setLoading(false);
      }
    };

    loadAll();

  }, [quotationID]);

  const init = async () => {
    setLoading(true);

    //check authentication redirect
    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    //get info from authentication
    const info = getAuthInfo();
    setAuth(info);

    //set language from token authentication
    const language = info?.language === "id" ? "id" : "en";
    setLang(language);

    setLoading(false);
  }
    
  const [items, setItems] = useState([
    { product: "", description: "", qty: 1, unitPrice: 0 }
  ]);

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const totalAmount = subtotal;
  
  const addItemRow = () => {
    setItems([
      ...items,
      { product: "", description: "", qty: 1, unitPrice: 0 }
    ]);
  };
  
  const removeItemRow = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };
  
  const updateItemField = (index: number, field: string, value: string) => {
    const next = [...items];

    if (field === "qty" || field === "unitPrice") {
      // @ts-ignore
      next[index][field] = Number(value);
    } else {
      // @ts-ignore
      next[index][field] = value;
    }

    setItems(next);
  };

  const handleChooseCustomer = (customer: GetCustomerData) => {
    setSelectedCustomer(customer);
    setCustomerModalOpen(false);
  };

  const handleChooseInquiry = async (rfq: GetRfq) => {
    try {
      setLoading(true);

      setSelectedInquiry(rfq);
      setLinkedInquiry(rfq.rfq_no);
      setLinkedInquiryID(rfq.inquiry_id);

      // fetch detail RFQ to get items
      const detailRes = await getDetailSalesRfq(rfq.inquiry_id);

      const detailItems = detailRes?.items ?? [];

      if (Array.isArray(detailItems) && detailItems.length > 0) {
        const mappedItems = detailItems.map((it: any) => ({
          id: crypto.randomUUID(),
          product: it.item_name ?? "",
          description: it.hs_code ?? "",
          qty: Number(it.quantity ?? 1),
          unitPrice: Number(it.unit_price ?? 0),
        }));

        setItems(mappedItems);
      }

    } catch (error) {
      console.error("Failed to bind inquiry items", error);
    } finally {
      setLoading(false);
      setInquiryModalOpen(false);
    }
  };

  const handleSave = async () => {
    try {
      if(!selectedCustomer)
        throw new Error(t.sales_quotation.error_1);
      if(!quotationNo)
        throw new Error(t.sales_quotation.error_2);
      if(!quotationDate)
        throw new Error(t.sales_quotation.error_3);
      if(!validUntil)
        throw new Error(t.sales_quotation.error_4);
      if(!currencySelected)
        throw new Error(t.sales_quotation.error_5);
      if(items.length === 0)
        throw new Error(t.sales_quotation.error_6);

      setLoading(true);

      const payload = {
        quotation_number: quotationNo,
        customer_id: selectedCustomer.customer_id,
        quotation_date: quotationDate,
        inquiry_id: linkedInquiryID,
        valid_until: validUntil,
        currency: currencySelected,
        subtotal: subtotal.toString(),
        total_amount: totalAmount.toString(),
        items: items.map((row) => ({
          item_name: row.product,
          description: row.description,
          quantity: Number(row.qty),
          unit_price: Number(row.unitPrice),
          subtotal: Number(row.qty) * Number(row.unitPrice)
        }))
      }

      const res = await createSalesQuotation(payload);

      setShowAlert(true);
      setIsSuccess(true);
      setTitlePopup(t.master.success);
      setMessagePopup(t.sales_quotation.success_create);
      setTimeout(() => setShowAlert(false), 6000);

      setSelectedCustomer(null);
      setQuotationNo("");
      setQuotationDate("");
      setValidUntil("");
      setSelected("");
      setLinkedInquiry("");
      setLinkedInquiryID("");
      setItems([{ product: "", description: "", qty: 1, unitPrice: 0 }]);
    } catch (err: any) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(err.message || t.sales_quotation.error_msg);
      setTimeout(() => setShowAlert(false), 6000);
    } finally {
      setLoading(false);
    }
  } 

  const canGeneratePDF = !!selectedCustomer;
  
  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading size="lg" mb={4}>{t.sales_quotation.title_create}</Heading>

      {/* Lookup for customer and inquiry */}
      <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
      <InquiryLookup isOpen={inquiryModalOpen} onClose={() => setInquiryModalOpen(false)} onChoose={handleChooseInquiry}/>

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess}/>}
      
      <Card.Root gap={6}>
        <Card.Body>
          {/* Customer area */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={9}>
            <Stack gap={4}>
              <Text fontWeight="semibold" mb={3}>{t.sales_quotation.customer_information}</Text>
              <Field.Root required>
                <Field.Label>{t.sales_quotation.customer_name} <Field.RequiredIndicator/> </Field.Label>
                <Input placeholder={t.sales_quotation.customer_name_placeholder} value={selectedCustomer?.customer_name ?? ""} readOnly cursor="pointer" onClick={() => setCustomerModalOpen(true)}/>
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_quotation.phone_number}</Field.Label>
                <Input placeholder={t.sales_quotation.phone_number_placeholder} value={selectedCustomer?.customer_phone ?? ""} readOnly/>
              </Field.Root>
            </Stack>
            {/* Quotation area */}
            <Stack gap={4}>
              <Text fontWeight="semibold" mb={3}>{t.sales_quotation.quotation_details}</Text>              
              <Field.Root>
                <Field.Label>{t.sales_quotation.linked_inquiry}</Field.Label>
                <Input placeholder={t.sales_quotation.linked_inquiry_placeholder} value={linkedInquiry} readOnly cursor="pointer" onClick={() => setInquiryModalOpen(true)}/>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_quotation.quotation_no}<Field.RequiredIndicator/> </Field.Label>
                <Input placeholder={t.sales_quotation.quotation_no_placeholder} value={quotationNo} onChange={(e) => setQuotationNo(e.target.value)}/>
              </Field.Root>
              <SimpleGrid columns={{base : 1, md: 2}} gap={6}>
                <Field.Root required>
                  <Field.Label>{t.sales_quotation.quotation_date}<Field.RequiredIndicator/></Field.Label>
                  <Input type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)}/>
                </Field.Root>
                <Field.Root required>
                  <Field.Label>{t.sales_quotation.valid_until}<Field.RequiredIndicator/></Field.Label>
                  <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}/>
                </Field.Root>
              </SimpleGrid>
              
              <Field.Root required>
                <Field.Label>{t.sales_quotation.currency} <Field.RequiredIndicator/></Field.Label>
                <Select.Root collection={currencyCollection} value={currencySelected ? [currencySelected] : []} onValueChange={(details) => setSelected(details.value[0])} width="100%">
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_quotation.currency_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {currencyCollection.items.map((currency) => (
                          <Select.Item item={currency} key={currency.value}>{currency.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                       </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>

            </Stack>
          </SimpleGrid>

          <Separator mt={7} mb={4}/>

          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="semibold">{t.sales_quotation.quotation_items}</Text>
            <Button size="sm" bg="#E77A1F" color="white"  onClick={addItemRow}>{t.sales_quotation.add_item}</Button>
          </Flex>

          {items.map((row, index) => (
            <Card.Root key={index} p={4} mb={2}>
              <SimpleGrid columns={{ base: 1, md: 4 }} gap={3}>
                <Field.Root required>
                  <Field.Label>{t.sales_quotation.product_service}<Field.RequiredIndicator/></Field.Label>
                  <Input placeholder={t.sales_quotation.product_service} value={row.product} onChange={(e) => updateItemField(index, "product", e.target.value)}/>
                </Field.Root>
                <Field.Root required>
                  <Field.Label>{t.sales_quotation.description}<Field.RequiredIndicator/></Field.Label>
                  <Input placeholder={t.sales_quotation.description} value={row.description} onChange={(e) => updateItemField(index, "description", e.target.value)}/>
                </Field.Root>
                <Field.Root required>
                  <Field.Label>{t.sales_quotation.quantity}<Field.RequiredIndicator/></Field.Label>
                  <Input type="number" placeholder={t.sales_quotation.quantity} value={row.qty} onChange={(e) => updateItemField(index, "qty", e.target.value)}/>
                </Field.Root>
                <Field.Root required>
                  <Field.Label>{t.sales_quotation.unit_price}<Field.RequiredIndicator/></Field.Label>
                  <Input type="number" placeholder={t.sales_quotation.unit_price} value={row.unitPrice} onChange={(e) => updateItemField(index, "unitPrice", e.target.value)}/>
                </Field.Root>
              </SimpleGrid>

              <HStack justify="space-between" mt={3}>
                <Badge colorScheme="purple">{t.sales_quotation.subtotal_auto}</Badge>
                <IconButton aria-label="Remove item" size="sm" variant="ghost" onClick={() => removeItemRow(index)}>
                  <FaTrash color="red"/>
                </IconButton>
              </HStack>
            </Card.Root>
          ))}

          <Separator mt={6} mb={6} />

          <Flex justify="flex-end" mb={4}>
            <Stack minW="220px">
              <Flex justify="space-between">
                <Text fontWeight="semibold">Subtotal</Text>
                <Text>{subtotal.toLocaleString()}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontWeight="bold">Total</Text>
                <Text fontWeight="bold">{totalAmount.toLocaleString()}</Text>
              </Flex>
            </Stack>
          </Flex>

          {/* button action area */}
          <Flex justify="flex-end" gap={3}>
            <Button variant="outline">{t.sales_quotation.cancel}</Button>
            <Button bg="#E77A1F" color="white" onClick={handleSave}>{t.sales_quotation.save_draft}</Button>
            <Button bg="#E77A1F" color="white" disabled={!canGeneratePDF}>{t.sales_quotation.save_generate_pdf}</Button>
          </Flex>

          {/* restircted if customer only draft */}
          {!canGeneratePDF && (
            <Text fontSize="sm" color="red.500" mt={2}>{t.sales_quotation.error_7}</Text>
          )}
        </Card.Body>
      </Card.Root>

    </SidebarWithHeader>
  );
}