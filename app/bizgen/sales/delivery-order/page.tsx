'use client';

import Loading from '@/components/loading';
import CustomerLookup from '@/components/lookup/CustomerLookup';
import SalesOrderLookup from '@/components/lookup/SalesOrderLookup';
import { AlertMessage } from '@/components/ui/alert';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { GetCustomerData } from '@/lib/master/customer';
import { getAllItem, GetItemData } from '@/lib/master/item';
import { getAllUOM, UOMData } from '@/lib/master/uom';
import { createDeliveryOrder, generateSalesDeliveryNumber } from '@/lib/sales/delivery-order';
import { GetSalesOrderItemData } from '@/lib/sales/sales-order';
import {Button, Card, Flex, Heading, Input, Text, Textarea, Field, Separator, NumberInput, SimpleGrid, Box, useListCollection, useFilter, createListCollection, Combobox, Portal, Select} from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type DeliveryMode = "create" | "view" | "edit";

export default function CreateDeliveryOrderPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DeliveryOrderContent />
    </Suspense>
  );
}

function DeliveryOrderContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //retrieve rfq ID
  const searchParams = useSearchParams();
  const deliveryOrderID = searchParams.get("delivery_order_id");
  
  const [deliveryOrderStatus, setDeliveryOrderStatus] = useState<string>();
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();

  //set mode for create/update/view
  const [mode, setMode] = useState<DeliveryMode>("create");
  const isReadOnly = mode === "view" && deliveryOrderStatus !== "draft" && deliveryOrderStatus !== "rejected";
  
  //alert & success variable
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  //to open customer popup
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<GetCustomerData | null>(null);
  const [selectecCustomerID, setSelectedCustomerID] = useState("");

  const [salesOrderModalOpen, setSalesOrderModalOpen] = useState(false);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<GetSalesOrderItemData | null>(null);
  const [selectedSalesOrderID, setSelectedSalesOrderID] = useState("");

  const [itemCollections, setItemCollections] = useState<GetItemData[]>([]);
  const { contains } = useFilter({ sensitivity: "base" })

  const { collection: itemCollection, set: setItemCollection } = useListCollection<GetItemData>({
    initialItems: [],
    itemToString: (item) => `${item.item_code} - ${item.item_name}`,
    itemToValue: (item) => item.item_id,
  })

  const [uomOptions, setUOMOptions] = useState<UOMData[]>([]);
      
  const uomCollection = createListCollection({
    items: uomOptions.map((uom) => ({
      label: `${uom.uom_name}`,
      value: uom.uom_id,
    })),
  });

  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [doNumber, setDoNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [reference, setReference] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const loadMaster = async () => {
      try {
        setLoading(true);

        await init();

        const [uomRes, itemRes] = await Promise.all([
          getAllUOM(1, 1000),
          getAllItem(1, 10000)
        ]);

        setUOMOptions(uomRes?.data ?? []);
         
        const itemData = itemRes?.data ?? [];

        setItemCollection(itemData);
        setItemCollections(itemData);
      } catch (err) {
        console.error(err);
      }
    }

    const loadDetail = async () => {
      if (!deliveryOrderID) return;
    }

    const loadGeneratedNumber = async () => {
      if (deliveryOrderID) return;

      try {
        const res = await generateSalesDeliveryNumber();
        setDoNumber(res.number);
      } catch (err) {
        console.error("Failed to generate delivery number", err);
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

  }, [deliveryOrderID]);

  const init = async () => {
    //check authentication redirect
    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    //get info from authentication
    const info = getAuthInfo();
    setAuth(info);

    //set language from token authentication
    const language = info?.language === "id" ? "id" : "en";
    setLang(language);
  }
    
  const [lineItems, setLineItems] = useState([
    { id: Date.now(), itemId: '', description: '', qty: 1, uom: '', notes: '' },
  ]);

  const handleItemChange = (id: number, field: string, value: any) => {
    setLineItems(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const addRow = () =>
    setLineItems(prev => [
      ...prev, 
      {
        id: Date.now(),
        itemId: '',
        description: '',
        qty: 1,
        uom: '',
        notes: ''
      }
  ]);

  const removeRow = (id: number) => {
    setLineItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev)
  }

  const handleChooseCustomer = (customer: GetCustomerData) => {
    setSelectedCustomer(customer);
    setCustomerModalOpen(false);
  };

  const handleChooseSalesOrder = (sales_order: GetSalesOrderItemData) => {
    setSelectedSalesOrder(sales_order);
    setSalesOrderModalOpen(false);
  };
      
  const handleSubmit = async () => {

    setLoading(true);

    try { 
      if(!doNumber)
        throw new Error(t.sales_delivery_order.error_1);
      if(!issueDate)
        throw new Error(t.sales_delivery_order.error_2);
      if(!selectedSalesOrder?.sales_order_id)
        throw new Error(t.sales_delivery_order.error_6);
      if(!selectedCustomer?.customer_id)
        throw new Error(t.sales_delivery_order.error_3);
      if(!deliveryDate)
        throw new Error(t.sales_delivery_order.error_4);
      if(lineItems.length === 0)
        throw new Error(t.sales_delivery_order.error_5);

      const payload = {
        do_number: doNumber,
        issue_date: issueDate,
        sales_order_id: selectedSalesOrder.sales_order_id,
        customer_id: selectedCustomer.customer_id,
        delivery_date: deliveryDate,
        remarks: remarks,
        items: lineItems.map((row) => ({
          items_id: row.itemId,
          quantity: String(row.qty),
          uom_id: row.uom,
          notes: row.notes || ""
        }))
      }

      const res = await createDeliveryOrder(payload);
    
      setShowAlert(true);
      setIsSuccess(true);
      setTitlePopup(t.master.success);
      setMessagePopup(t.sales_delivery_order.success_create);

      setSelectedCustomer(null);
      setSelectedSalesOrder(null);
      setDeliveryAddress("");
      setDeliveryDate("");
      setIssueDate("");
      setReference("");
      setRemarks("");

      setLineItems([
        { id: Date.now(), itemId: '', description: '', qty: 1, uom: '', notes: '' }
      ]);

      // regenerate new DO number
      try {
        const newNumber = await generateSalesDeliveryNumber();
        setDoNumber(newNumber.number);
      } catch (err) {
        console.error("Failed to regenerate delivery number", err);
      }
    } catch (err: any) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(err.message || t.sales_costing_expense.error_msg);
      setTimeout(() => setShowAlert(false), 6000);
    } finally {
      setLoading(false);
    }
    
    };

  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading size="lg" mb={4}>{t.sales_delivery_order.title_create}</Heading>

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess}/>}
      <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
      <SalesOrderLookup isOpen={salesOrderModalOpen} onClose={() => setSalesOrderModalOpen(false)} onChoose={handleChooseSalesOrder} />
      
      <Card.Root>
        <Card.Header>
          <Heading size="md">{t.sales_delivery_order.document_information}</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{base: 1, md: 2, lg: 3}} gap={5}>
            <Field.Root required>
              <Field.Label>{t.sales_delivery_order.do_number} <Field.RequiredIndicator/></Field.Label>
              <Input placeholder={t.sales_delivery_order.do_number_placeholder} value={doNumber} onChange={(e) => setDoNumber(e.target.value)} />
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.sales_delivery_order.issue_date}<Field.RequiredIndicator/></Field.Label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.sales_delivery_order.reference}<Field.RequiredIndicator/></Field.Label>
              <Input placeholder={t.sales_order.customer_placeholder} value={selectedSalesOrder?.sales_order_no ?? ""} readOnly cursor="pointer" onClick={() => setSalesOrderModalOpen(true)}/>
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.sales_delivery_order.customer_name}<Field.RequiredIndicator/></Field.Label>
              <Input placeholder={t.sales_order.customer_placeholder} value={selectedCustomer?.customer_name ?? ""} readOnly cursor="pointer" onClick={() => setCustomerModalOpen(true)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_delivery_order.customer_info}</Field.Label>
              <Box fontSize="xs" color="gray.500" lineHeight="short">
                <Text>{selectedCustomer?.customer_address ?? "-"}</Text>
                <Text>{selectedCustomer?.customer_phone ?? "-"}</Text>
                <Text>TOP: {selectedCustomer?.customer_top ?? "-"}</Text>
              </Box>
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.sales_delivery_order.delivery_date}<Field.RequiredIndicator/></Field.Label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </Field.Root>
          </SimpleGrid>
          
          <Separator mt={5} mb={5}/>

          <Heading size="md" mb={4}>{t.sales_delivery_order.charges_items}</Heading>

          <Box overflowX="auto">
            {lineItems.map((li, i) => (
              <SimpleGrid key={i} templateColumns={"300px 200px 250px 400px 200px"} gap={6} mb={5}>
                <Field.Root>
                  <Field.Label>{t.sales_delivery_order.description_label}</Field.Label>
                  {/* <Input value={li.description} onChange={(e) => handleItemChange(li.id, 'description', e.target.value)} placeholder={t.sales_delivery_order.description_placeholder}/> */}
                    <Combobox.Root key={`item-${li.id}`} collection={itemCollection} value={li.itemId ? [li.itemId.toString()] : []}
                      onValueChange={(details) => {
                      const selected = details.value?.[0];
                      handleItemChange(li.id, 'itemId', selected ?? '');
                    }}
                    onInputValueChange={(e) => {
                      const input = e.inputValue ?? "";

                      if (!input || input.trim() === "") {
                        setItemCollection(itemCollections);
                        return;
                      }

                      const filtered = itemCollections.filter((item) =>
                        contains(`${item.item_code} - ${item.item_name}`, input)
                      );

                      setItemCollection(filtered);
                    }}>
                      <Combobox.Control>
                        <Combobox.Input placeholder={t.sales_order.product_name_placeholder} onFocus={() => setItemCollection(itemCollections)}/>
                        <Combobox.IndicatorGroup>
                          <Combobox.ClearTrigger />
                          <Combobox.Trigger />
                        </Combobox.IndicatorGroup>
                      </Combobox.Control>
                      <Portal>
                        <Combobox.Positioner>
                          <Combobox.Content>
                            <Combobox.Empty>{t.sales_order.no_product}</Combobox.Empty>
                              {itemCollection.items.map((item) => (
                                <Combobox.Item item={item} key={item.item_id}>
                                  {item.item_code} - {item.item_name}
                                  <Combobox.ItemIndicator />
                                </Combobox.Item>
                              ))}
                          </Combobox.Content>
                        </Combobox.Positioner>
                      </Portal>
                    </Combobox.Root>
                </Field.Root>
                <Field.Root w={"100%"}>
                  <Field.Label>{t.sales_delivery_order.quantity}</Field.Label>
                  <NumberInput.Root w={"100%"} value={String(li.qty)} onValueChange={(details) => handleItemChange(li.id, 'qty', Number(details.value))}>
                    <NumberInput.Control/>
                    <NumberInput.Input/>
                  </NumberInput.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t.sales_delivery_order.uom}</Field.Label>
                    <Select.Root disabled={isReadOnly} collection={uomCollection} value={li.uom && uomCollection.items.some(i => i.value === li.uom) ? [li.uom] : []} onValueChange={(details) => handleItemChange(li.id, "uom", details.value?.[0] ?? "")} width="100%">
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder={t.sales_inquiry.unit_placeholder} />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {uomCollection.items.map((uom) => (
                                <Select.Item item={uom} key={uom.value}>{uom.label}<Select.ItemIndicator /></Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                    </Select.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t.sales_delivery_order.notes}</Field.Label>
                  <Input value={li.notes} onChange={(e) => handleItemChange(li.id, 'notes', e.target.value)} placeholder={t.sales_delivery_order.notes_placeholder}/>
                </Field.Root>
                <Button borderColor={"red"} color="red" variant="ghost" onClick={() => removeRow(li.id)}>{t.sales_delivery_order.remove}</Button>
              </SimpleGrid>
            ))}
          </Box>
          
          <Button mt={4} mb={4} onClick={addRow} variant="outline">{t.sales_delivery_order.add_item}</Button>

          <Field.Root>
            <Field.Label>{t.sales_delivery_order.remarks}</Field.Label>
            <Textarea placeholder={t.sales_delivery_order.remarks_placeholder} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </Field.Root>

          <Flex justify="flex-end" gap={3} mt={4}>
            <Button variant="ghost">{t.sales_delivery_order.cancel}</Button>
            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleSubmit}>{t.sales_delivery_order.save}</Button>
          </Flex>
        </Card.Body>
      </Card.Root>

    </SidebarWithHeader>
    
  );
}