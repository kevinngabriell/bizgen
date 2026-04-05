"use client";

import Loading from "@/components/loading";
import CustomerLookup from "@/components/lookup/CustomerLookup";
import InquiryLookup from "@/components/lookup/SalesInquiryLookup";
import { AlertMessage } from "@/components/ui/alert";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import RejectDialog from "@/components/dialog/RejectDialog";
import { SALES_APPROVAL_ROLES, SALES_CREATE_ROLES, DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { GetCustomerData } from "@/lib/master/customer";
import {
  createSalesQuotation,
  generateQuotationNumber,
  getDetailSalesQuotation,
  updateSalesQuotation,
  processSalesQuotationAction,
  GetDetailQuotationHistory,
} from "@/lib/sales/quotation";
import { GetRfq, getDetailSalesRfq } from "@/lib/sales/rfq";
import {
  Button, Flex, Heading, HStack, Input, Select, SimpleGrid, Stack,
  Text, Badge, IconButton, Separator, Card, Field, createListCollection,
  Portal,
} from "@chakra-ui/react";
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

  const canApprove = SALES_APPROVAL_ROLES.has(auth?.app_role_id ?? "");
  const canCreate = SALES_CREATE_ROLES.has(auth?.app_role_id ?? "");

  //retrieve quotation ID from URL
  const searchParams = useSearchParams();
  const quotationID = searchParams.get("quotation_id");

  const [quotationStatus, setQuotationStatus] = useState<string>();
  const [quotationDetailId, setQuotationDetailId] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [historyData, setHistoryData] = useState<GetDetailQuotationHistory[]>([]);

  //set mode for create/view
  const [mode, setMode] = useState<QuotationMode>("create");
  const isReadOnly = mode === "view" && quotationStatus !== "draft" && quotationStatus !== "cancelled";

  //reject dialog state
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  //customer lookup
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<GetCustomerData | null>(null);

  //inquiry lookup
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<GetRfq | null>(null);

  //currency options
  const [currencySelected, setSelected] = useState<string>();
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((cur) => ({
      label: `${cur.currency_name} (${cur.currency_symbol})`,
      value: cur.currency_id,
    })),
  });

  //quotation header state
  const [quotationNo, setQuotationNo] = useState("");
  const [quotationDate, setQuotationDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [linkedInquiry, setLinkedInquiry] = useState("");
  const [linkedInquiryID, setLinkedInquiryID] = useState("");

  //alert state
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const showSuccess = (msg: string) => {
    setShowAlert(true);
    setIsSuccess(true);
    setTitlePopup(t.master.success);
    setMessagePopup(msg);
    setTimeout(() => setShowAlert(false), 6000);
  };

  const showError = (msg: string) => {
    setShowAlert(true);
    setIsSuccess(false);
    setTitlePopup(t.master.error);
    setMessagePopup(msg);
    setTimeout(() => setShowAlert(false), 6000);
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        //check auth
        const valid = await checkAuthOrRedirect();
        if (!valid) return;
        const info = getAuthInfo();
        setAuth(info);
        const language = info?.language === "id" ? "id" : "en";
        setLang(language);

        //load currencies
        const currencies = (await getAllCurrency(1, 1000))?.data ?? [];
        setCurrencyOptions(currencies);

        if (quotationID) {
          //view mode — load detail
          setMode("view");
          const res = await getDetailSalesQuotation(quotationID);

          setQuotationDetailId(res.header.sales_quotation_id);
          setQuotationNo(res.header.sales_quotation_number);
          setQuotationDate(res.header.quotation_date);
          setValidUntil(res.header.valid_until);
          setQuotationStatus(res.header.quotation_status);
          setLastUpdatedAt(res.header.updated_at ?? "");
          setLastUpdatedBy(res.header.updated_by ?? "");
          
          //set customer display
          setSelectedCustomer({
            customer_id: "",
            customer_name: res.header.customer_name,
            customer_phone: "",
            customer_address: "",
            customer_pic_name: "",
            customer_pic_contact: "",
            customer_top: 0,
            created_by: "",
            created_at: "",
            updated_by: "",
            updated_at: "",
            company_id: "",
          });

          //match currency by code
          const matched = currencies.find((c) => c.currency_code === res.header.currency_code);
          if (matched) setSelected(matched.currency_id);

          //set items
          setItems(
            res.items.map((item) => ({
              product: item.item_name,
              description: item.description,
              qty: item.quantity,
              unitPrice: item.unit_price,
            }))
          );

          //set history
          setHistoryData(res.history);

        } else {
          //create mode — generate number
          const numberRes = await generateQuotationNumber();
          setQuotationNo(numberRes.number);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [quotationID]);

  const [items, setItems] = useState([
    { product: "", description: "", qty: 1, unitPrice: 0 }
  ]);

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const totalAmount = subtotal;

  const addItemRow = () => {
    setItems([...items, { product: "", description: "", qty: 1, unitPrice: 0 }]);
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

      const detailRes = await getDetailSalesRfq(rfq.inquiry_id);
      const detailItems = detailRes?.items ?? [];

      if (Array.isArray(detailItems) && detailItems.length > 0) {
        setItems(
          detailItems.map((it: any) => ({
            id: crypto.randomUUID(),
            product: it.item_name ?? "",
            description: it.hs_code ?? "",
            qty: Number(it.quantity ?? 1),
            unitPrice: Number(it.unit_price ?? 0),
          }))
        );
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
      if (!selectedCustomer) throw new Error(t.sales_quotation.error_1);
      if (!quotationNo)       throw new Error(t.sales_quotation.error_2);
      if (!quotationDate)     throw new Error(t.sales_quotation.error_3);
      if (!validUntil)        throw new Error(t.sales_quotation.error_4);
      if (!currencySelected)  throw new Error(t.sales_quotation.error_5);
      if (items.length === 0) throw new Error(t.sales_quotation.error_6);

      setLoading(true);

      await createSalesQuotation({
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
          subtotal: Number(row.qty) * Number(row.unitPrice),
        })),
      });

      showSuccess(t.sales_quotation.success_create);

      setSelectedCustomer(null);
      setQuotationNo("");
      setQuotationDate("");
      setValidUntil("");
      setSelected("");
      setLinkedInquiry("");
      setLinkedInquiryID("");
      setItems([{ product: "", description: "", qty: 1, unitPrice: 0 }]);
    } catch (err: any) {
      showError(err.message || t.sales_quotation.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!quotationDetailId) throw new Error("Quotation ID not found");
      setLoading(true);

      await updateSalesQuotation({
        quotation_id: quotationDetailId,
        quotation_date: quotationDate,
        valid_until: validUntil,
        subtotal: subtotal.toString(),
        total_amount: totalAmount.toString(),
        items: items.map((row) => ({
          item_name: row.product,
          description: row.description,
          quantity: Number(row.qty),
          unit_price: Number(row.unitPrice),
          subtotal: Number(row.qty) * Number(row.unitPrice),
        })),
      });

      showSuccess(t.sales_quotation.success_update);
    } catch (err: any) {
      showError(err.message || t.sales_quotation.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuotation = async () => {
    try {
      if (!quotationDetailId) throw new Error("Quotation ID not found");
      setLoading(true);

      await processSalesQuotationAction({
        quotation_id: quotationDetailId,
        action: "send",
      });

      setQuotationStatus("sent");
      showSuccess("Quotation submitted successfully.");
    } catch (err: any) {
      showError(err.message || t.sales_quotation.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      if (!quotationDetailId) throw new Error("Quotation ID not found");
      setLoading(true);

      await processSalesQuotationAction({
        quotation_id: quotationDetailId,
        action: "approve",
      });

      setQuotationStatus("accepted");
      showSuccess("Quotation approved successfully.");
    } catch (err: any) {
      showError(err.message || t.sales_quotation.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      if (!quotationDetailId) throw new Error("Quotation ID not found");
      setRejectLoading(true);

      await processSalesQuotationAction({
        quotation_id: quotationDetailId,
        action: "reject",
        notes: reason,
      });

      setIsRejectDialogOpen(false);
      setQuotationStatus("cancelled");
      showSuccess("Quotation rejected successfully.");
    } catch (err: any) {
      showError(err.message || t.sales_quotation.error_msg);
    } finally {
      setRejectLoading(false);
    }
  };

  const canGeneratePDF = !!selectedCustomer;

  if (loading) return <Loading />;

  return (
    <>
      <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>

        {/* Lookups */}
        <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
        <InquiryLookup isOpen={inquiryModalOpen} onClose={() => setInquiryModalOpen(false)} onChoose={handleChooseInquiry} />

        <Flex direction="column">
          <Heading size="lg" mb={4}>
            {mode === "create" && t.sales_quotation.title_create}
            {mode === "view" && t.sales_quotation.title_view}
            {mode === "edit" && t.sales_quotation.title_edit}
          </Heading>

          {mode === "view" && (
            <Card.Root mt={3}>
              <Card.Body>
                <Flex justifyContent="space-between">
                  <Badge
                    variant="solid"
                    colorPalette={
                      quotationStatus === "accepted" ? "green"
                      : quotationStatus === "cancelled" ? "red"
                      : quotationStatus === "sent" ? "blue"
                      : "yellow"
                    }
                  >
                    {quotationStatus ? quotationStatus.charAt(0).toUpperCase() + quotationStatus.slice(1) : ""}
                  </Badge>
                  <Text fontSize="xs" color="gray.600">
                    {t.master.last_update_by} <b>{lastUpdatedBy}</b> •{" "}
                    {lastUpdatedAt
                      ? new Date(lastUpdatedAt).toLocaleDateString(
                          lang === "id" ? "id-ID" : "en-US",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )
                      : "-"}
                  </Text>
                </Flex>
              </Card.Body>
            </Card.Root>
          )}
        </Flex>

        {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

        <Card.Root gap={6} mt={5}>
          <Card.Body>
            {/* Customer + quotation details */}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={9}>
              <Stack gap={4}>
                <Text fontWeight="semibold" mb={3}>{t.sales_quotation.customer_information}</Text>
                <Field.Root required>
                  <Field.Label>{t.sales_quotation.customer_name} <Field.RequiredIndicator /></Field.Label>
                  <Input
                    placeholder={t.sales_quotation.customer_name_placeholder}
                    value={selectedCustomer?.customer_name ?? ""}
                    readOnly
                    cursor={isReadOnly ? "default" : "pointer"}
                    onClick={() => !isReadOnly && setCustomerModalOpen(true)}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t.sales_quotation.phone_number}</Field.Label>
                  <Input
                    placeholder={t.sales_quotation.phone_number_placeholder}
                    value={selectedCustomer?.customer_phone ?? ""}
                    readOnly
                  />
                </Field.Root>
              </Stack>

              <Stack gap={4}>
                <Text fontWeight="semibold" mb={3}>{t.sales_quotation.quotation_details}</Text>
                <Field.Root>
                  <Field.Label>{t.sales_quotation.linked_inquiry}</Field.Label>
                  <Input
                    placeholder={t.sales_quotation.linked_inquiry_placeholder}
                    value={linkedInquiry}
                    readOnly
                    cursor={isReadOnly ? "default" : "pointer"}
                    onClick={() => !isReadOnly && setInquiryModalOpen(true)}
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>{t.sales_quotation.quotation_no}<Field.RequiredIndicator /></Field.Label>
                  <Input
                    placeholder={t.sales_quotation.quotation_no_placeholder}
                    value={quotationNo}
                    readOnly={isReadOnly}
                    onChange={(e) => setQuotationNo(e.target.value)}
                  />
                </Field.Root>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                  <Field.Root required>
                    <Field.Label>{t.sales_quotation.quotation_date}<Field.RequiredIndicator /></Field.Label>
                    <Input
                      type="date"
                      value={quotationDate}
                      readOnly={isReadOnly}
                      onChange={(e) => setQuotationDate(e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label>{t.sales_quotation.valid_until}<Field.RequiredIndicator /></Field.Label>
                    <Input
                      type="date"
                      value={validUntil}
                      readOnly={isReadOnly}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
                  </Field.Root>
                </SimpleGrid>

                <Field.Root required>
                  <Field.Label>{t.sales_quotation.currency} <Field.RequiredIndicator /></Field.Label>
                  <Select.Root
                    disabled={isReadOnly}
                    collection={currencyCollection}
                    value={currencySelected ? [currencySelected] : []}
                    onValueChange={(details) => setSelected(details.value[0])}
                    width="100%"
                  >
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
                            <Select.Item item={currency} key={currency.value}>
                              {currency.label}<Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>
              </Stack>
            </SimpleGrid>

            <Separator mt={7} mb={4} />

            <Flex justify="space-between" align="center" mb={4}>
              <Text fontWeight="semibold">{t.sales_quotation.quotation_items}</Text>
              {!isReadOnly && (
                <Button size="sm" bg="#E77A1F" color="white" onClick={addItemRow}>
                  {t.sales_quotation.add_item}
                </Button>
              )}
            </Flex>

            {items.map((row, index) => (
              <Card.Root key={index} p={4} mb={2}>
                <SimpleGrid columns={{ base: 1, md: 4 }} gap={3}>
                  <Field.Root required>
                    <Field.Label>{t.sales_quotation.product_service}<Field.RequiredIndicator /></Field.Label>
                    <Input
                      placeholder={t.sales_quotation.product_service}
                      value={row.product}
                      readOnly={isReadOnly}
                      onChange={(e) => updateItemField(index, "product", e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label>{t.sales_quotation.description}<Field.RequiredIndicator /></Field.Label>
                    <Input
                      placeholder={t.sales_quotation.description}
                      value={row.description}
                      readOnly={isReadOnly}
                      onChange={(e) => updateItemField(index, "description", e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label>{t.sales_quotation.quantity}<Field.RequiredIndicator /></Field.Label>
                    <Input
                      type="number"
                      placeholder={t.sales_quotation.quantity}
                      value={row.qty}
                      readOnly={isReadOnly}
                      onChange={(e) => updateItemField(index, "qty", e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label>{t.sales_quotation.unit_price}<Field.RequiredIndicator /></Field.Label>
                    <Input
                      type="number"
                      placeholder={t.sales_quotation.unit_price}
                      value={row.unitPrice}
                      readOnly={isReadOnly}
                      onChange={(e) => updateItemField(index, "unitPrice", e.target.value)}
                    />
                  </Field.Root>
                </SimpleGrid>

                <HStack justify="space-between" mt={3}>
                  <Badge colorScheme="purple">{t.sales_quotation.subtotal_auto}</Badge>
                  {!isReadOnly && (
                    <IconButton aria-label="Remove item" size="sm" variant="ghost" onClick={() => removeItemRow(index)}>
                      <FaTrash color="red" />
                    </IconButton>
                  )}
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

            {/* Button area */}
            {mode === "create" && canCreate && (
              <Flex justify="flex-end" gap={3}>
                <Button variant="outline">{t.sales_quotation.cancel}</Button>
                <Button bg="#E77A1F" color="white" onClick={handleSave}>{t.sales_quotation.save_draft}</Button>
                <Button bg="#E77A1F" color="white" disabled={!canGeneratePDF}>{t.sales_quotation.save_generate_pdf}</Button>
              </Flex>
            )}

            {(quotationStatus === "draft" || quotationStatus === "cancelled") && (
              <Flex justify="flex-end" gap={3}>
                <Button variant="outline" onClick={handleUpdate}>{t.master.save}</Button>
                <Button bg="#E77A1F" color="white" onClick={handleSubmitQuotation}>{t.master.submit}</Button>
              </Flex>
            )}

            {quotationStatus === "sent" && (
              <Flex gap={3} justifyContent="space-between">
                <Button variant="outline">{t.master.export_pdf}</Button>
                <Flex gap={6}>
                  {canApprove && <Button color="red" borderColor="red" variant="outline" onClick={() => setIsRejectDialogOpen(true)}>{t.master.reject}</Button>}
                  {canApprove && <Button backgroundColor="green" onClick={handleApprove}>{t.master.approve}</Button>}
                </Flex>
              </Flex>
            )}

            {mode === "create" && !canGeneratePDF && (
              <Text fontSize="sm" color="red.500" mt={2}>{t.sales_quotation.error_7}</Text>
            )}
          </Card.Body>
        </Card.Root>

        {/* History log */}
        {mode === "view" && historyData.length > 0 && (
          <Card.Root mt={6}>
            <Card.Body>
              <Heading size="xl" mb={3}>History Log</Heading>
              {historyData.map((log, index) => (
                <Flex key={index} justify="space-between" mb={2}>
                  <Text fontSize="sm">
                    {log.notes} by <b>{log.action_by}</b>
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString(
                          lang === "id" ? "id-ID" : "en-US",
                          {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit", second: "2-digit",
                            hour12: false,
                          }
                        )
                      : "-"}
                  </Text>
                </Flex>
              ))}
            </Card.Body>
          </Card.Root>
        )}

      </SidebarWithHeader>

      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleReject}
        loading={rejectLoading}
        lang={lang}
      />
    </>
  );
}
