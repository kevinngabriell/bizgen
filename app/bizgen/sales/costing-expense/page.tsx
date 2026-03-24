'use client';

import { Suspense, useEffect, useState } from 'react';
import { Box, Button, Card, Flex, Heading, IconButton, Input, Stack, Text, Textarea, SimpleGrid, Separator, createListCollection, Select, Portal, Field } from '@chakra-ui/react';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import Loading from '@/components/loading';
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from '@/lib/auth/auth';
import { useSearchParams } from 'next/navigation';
import { getLang } from '@/lib/i18n';
import { getAllShipVia, GetShipViaData } from '@/lib/master/ship-via';
import { getAllCurrency, GetCurrencyData } from '@/lib/master/currency';
import { getAllPort, GetPortData } from '@/lib/master/port';
import { FaTrash } from 'react-icons/fa';
import { GetCustomerData } from '@/lib/master/customer';
import CustomerLookup from '@/components/lookup/CustomerLookup';
import { createSalesCosting, generateSalesCostingNumber } from '@/lib/sales/costing';
import { AlertMessage } from '@/components/ui/alert';
import { GetSalesBookingData } from '@/lib/sales/booking-confirmation';
import SalesBookingLookup from '@/components/lookup/SalesJoborderLookup';
import { getAllCostingCategory, GetCostingCategoryData } from '@/lib/master/costing-category';

type CostingMode = "create" | "view" | "edit";

export default function CostingExpensePage() {
  return (
    <Suspense fallback={<Loading />}>
      <CostingExpenseContent />
    </Suspense>
  );
}

function CostingExpenseContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //retrieve rfq ID
  const searchParams = useSearchParams();
  const costingID = searchParams.get("costing_id");

  const [costingStatus, setCostingStatus] = useState<string>();
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();

  const [mode, setMode] = useState<CostingMode>("create");
  const isReadOnly = mode === "view" && costingStatus !== "draft" && costingStatus !== "rejected";

  //to open customer popup
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<GetCustomerData | null>(null);

  //shipment type option
  const [shipmentTypeSelected, setShipmentTypeSelected] = useState<string>();
  const [shipmentTypeOptions, setShipmentTypeOptions] = useState<GetShipViaData[]>([]);

  const shipmentTypeCollection = createListCollection({
    items: shipmentTypeOptions.map((shipment) => ({
      label: `${shipment.ship_via_name}`,
      value: shipment.ship_via_id,
    })),
  });
  
  //currency option
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((cur) => ({
      label: `${cur.currency_name} (${cur.currency_symbol})`,
      value: cur.currency_id,
    })),
  });

  //set origin and destination origin selection
  const [originSelected, setOriginSelected] = useState<string>();
  const [destinationSelected, setDestinationSelected] = useState<string>();
  const [portOptions, setPortOptions] = useState<GetPortData[]>([]);
  
  const portCollection = createListCollection({
    items: portOptions.map((port) => ({
      label: `${port.port_name} -  ${port.origin_name}`,
      value: port.port_id,
    })),
  });

  //alert & success variable
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [jobOrderModalOpen, setJobOrderModalOpen] = useState(false);
  const [selectedJobOrder, setSelectedJobOrder] = useState<GetSalesBookingData | null>(null);
  const [linkedJobOrder, setLinkedJobOrder] = useState("");
  const [linkedJobOrderID, setLinkedJobOrderID] = useState("");

  const [costingCategoryOptions, setCostingCategoryOptions] = useState<GetCostingCategoryData[]>([]);
    
  const costingCategoryCollection = createListCollection({
    items: costingCategoryOptions.map((cc) => ({
      label: `${cc.costing_category_name}`,
      value: cc.costing_category_id,
    })),
  });
  
    
  useEffect(() => {
    const loadMaster = async () => {
      try {
        setLoading(true);

        await init();

        const [currencyRes, shipViaRes, portRes, costingRes ] = await Promise.all([
          getAllCurrency(1, 1000),
          getAllShipVia(1, 1000),
          getAllPort(1, 1000),
          getAllCostingCategory(1, 1000)
        ]);

        setCurrencyOptions(currencyRes?.data ?? []);
        setShipmentTypeOptions(shipViaRes?.data ?? []);
        setPortOptions(portRes?.data ?? []);
        setCostingCategoryOptions(costingRes?.data ?? []);

      } catch (err){
        console.error(err);
      }
    }

    const loadDetail = async () => {
      if (!costingID) return;
    }

    const loadGeneratedNumber = async () => {
      if (costingID) return; // kalau ada rfqId, jangan generate (view/edit mode)
    
      try {
        const res = await generateSalesCostingNumber();
        setShipmentInfo(prev => ({
          ...prev,
          costingNo: res.number,
        }));
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

  }, [costingID]);

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

  const [costItems, setCostItems] = useState([
    {
      id: crypto.randomUUID(),
      category: '',
      description: '',
      vendor: '',
      currency: '',
      amount: 0,
      exchangeRate: 0,
      baseAmount: 0,
      remarks: '',
    },
  ]);

  const [shipmentInfo, setShipmentInfo] = useState({
    costingNo: '',
    joNumber: '',
    customer: '',
    origin: '',
    destination: '',
    mode: '',
    notes: '',
  });

  const handleAddRow = () => {
    setCostItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category: '',
        description: '',
        vendor: '',
        currency: '',
        amount: 0,
        exchangeRate: 0,
        baseAmount: 0,
        remarks: '',
      },
    ]);
  };

  const handleChooseJobOrder = async (job_order: GetSalesBookingData) => {
    try {
      setLoading(true);
      setSelectedJobOrder(job_order);
      setLinkedJobOrder(job_order.job_order_no);
      setLinkedJobOrderID(job_order.job_order_id);
    } catch (error) {
      console.error("Failed to bind inquiry items", error);
    } finally {
      setLoading(false);
      setJobOrderModalOpen(false);
    }
  };

  const handleRemoveRow = (id: string) => {
    setCostItems((prev) => prev.filter((c) => c.id !== id));
  };

  const handleChange = (id: string, field: string, value: any) => {
    setCostItems((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;

        const updated = { ...c, [field]: value };

        const amount = Number(updated.amount) || 0;
        const rate = Number(updated.exchangeRate) || 1;

        updated.baseAmount = amount * rate;

        return updated;
      })
    );
  };

  const totalAmount = costItems.reduce(
    (sum, c) => sum + (c.baseAmount || 0),
    0
  );

  const handleSaveDraft = async () => {
    try {
      if(!shipmentInfo.costingNo)
        throw new Error(t.sales_costing_expense.error_1);
      if(!linkedJobOrderID)
        throw new Error(t.sales_costing_expense.error_2);
      if(!shipmentInfo.customer)
        throw new Error(t.sales_costing_expense.error_3);
      if(!shipmentTypeSelected)
        throw new Error(t.sales_costing_expense.error_4);
      if(!originSelected)
        throw new Error(t.sales_costing_expense.error_5);
      if(!destinationSelected)
        throw new Error(t.sales_costing_expense.error_6);
      if(originSelected === destinationSelected)
        throw new Error(t.sales_costing_expense.error_7);
      if(costItems.length === 0)
        throw new Error(t.sales_costing_expense.error_8);

      setLoading(true);

      const payload = {
        sales_costing_no: shipmentInfo.costingNo,
        booking_no: linkedJobOrderID,
        customer_id: shipmentInfo.customer,
        ship_via_id: shipmentTypeSelected,
        origin_port: originSelected,
        destination_port: destinationSelected,
        notes: shipmentInfo.notes,
        items: costItems.map((row) => ({
          costing_category_id: row.category,
          description: row.description,
          supplier: row.vendor,
          notes: row.description,
          currency_id: row.currency,
          exchange_rate: String(row.exchangeRate ?? 0),
          amount: String(row.amount ?? 0)
        }))
      }

      const res = await createSalesCosting(payload);
      
      setShowAlert(true);
      setIsSuccess(true);
      setTitlePopup(t.master.success);
      setMessagePopup(t.sales_costing_expense.success_draft);
      setTimeout(() => setShowAlert(false), 6000);

      // reset form after success
      setShipmentInfo({costingNo: '', joNumber: '', customer: '', origin: '', destination: '', mode: '', notes: '',});
      setShipmentTypeSelected(undefined);
      setOriginSelected(undefined);
      setDestinationSelected(undefined);
      setLinkedJobOrder("");
      setLinkedJobOrderID("");

      setCostItems([{id: crypto.randomUUID(), category: '', description: '', vendor: '', currency: '', amount: 0, exchangeRate: 0, baseAmount: 0, remarks: '',},]);

      // Optional: regenerate costing number after reset
      try {
        const newNumber = await generateSalesCostingNumber();
        setShipmentInfo(prev => ({ ...prev, costingNo: newNumber.number }));
      } catch (err) {
        console.error("Failed to regenerate costing number", err);
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

  const handleChooseCustomer = (customer: GetCustomerData) => {
    setSelectedCustomer(customer);
    setShipmentInfo(prev => ({
      ...prev,
      customer: customer.customer_id,
    }));
    setCustomerModalOpen(false);
  };

  if (loading) return <Loading/>;
  
  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Stack gap={6}>
        <Heading size="lg">{t.sales_costing_expense.title}</Heading>

        <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
        <SalesBookingLookup isOpen={jobOrderModalOpen} onClose={() => setJobOrderModalOpen(false)} onChoose={handleChooseJobOrder}/>
        
        {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess}/>}
        
        {/* Shipment Context Header */}
        <Card.Root variant="outline">
          <Card.Header>
            <Heading size="md">{t.sales_costing_expense.shipment_context}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root required>
                <Field.Label>{t.sales_costing_expense.costing_number}<Field.RequiredIndicator/></Field.Label>
                <Input placeholder={t.sales_costing_expense.costing_number_placeholder} value={shipmentInfo.costingNo} onChange={(e) => setShipmentInfo({ ...shipmentInfo, costingNo: e.target.value })}/>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_costing_expense.job_booking_number} <Field.RequiredIndicator/></Field.Label>
                <Input placeholder={t.sales_shipment_process.job_booking_no_placeholder} value={linkedJobOrder} readOnly cursor="pointer" onClick={() => setJobOrderModalOpen(true)}/>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_costing_expense.customer} <Field.RequiredIndicator/></Field.Label>
                <Input placeholder={t.sales_costing_expense.customer_placeholder} value={selectedCustomer?.customer_name ?? ""} readOnly cursor="pointer" onClick={() => setCustomerModalOpen(true)}/>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_costing_expense.shipment_type} <Field.RequiredIndicator/></Field.Label>
                <Select.Root collection={shipmentTypeCollection} value={shipmentTypeSelected ? [shipmentTypeSelected] : []}onValueChange={(details) => setShipmentTypeSelected(details.value[0])}>
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_costing_expense.shipment_type_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {shipmentTypeCollection.items.map((shipment) => (
                          <Select.Item item={shipment} key={shipment.value}>{shipment.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_costing_expense.origin_port}<Field.RequiredIndicator/></Field.Label>
                <Select.Root collection={portCollection} value={originSelected ? [originSelected] : []} onValueChange={(details) => setOriginSelected(details.value[0])} width="100%">
                  <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder={t.sales_costing_expense.origin_port_placeholder} />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {portCollection.items.map((port) => (
                            <Select.Item item={port} key={port.value}>{port.label}<Select.ItemIndicator /></Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                </Select.Root>
              </Field.Root>
            <Field.Root required>
              <Field.Label>{t.sales_costing_expense.destination_port}<Field.RequiredIndicator/></Field.Label>
              <Select.Root collection={portCollection} value={destinationSelected ? [destinationSelected] : []} onValueChange={(details) => setDestinationSelected(details.value[0])} width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.sales_costing_expense.destination_port_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {portCollection.items.map((port) => (
                        <Select.Item item={port} key={port.value}>{port.label}<Select.ItemIndicator /></Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
            </SimpleGrid>
            <Field.Root mt={6}>
              <Field.Label>{t.sales_costing_expense.notes_optional}</Field.Label>
              <Textarea placeholder={t.sales_costing_expense.notes_optional_placeholder} rows={3} value={shipmentInfo.notes} onChange={(e) => setShipmentInfo({ ...shipmentInfo, notes: e.target.value })}/>
            </Field.Root>
          </Card.Body>
        </Card.Root>

      {/* Cost Items */}
      <Card.Root variant="outline">
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">{t.sales_costing_expense.actual_expense_items}</Heading>
            <Button size="sm" variant="solid" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleAddRow} >
              {t.sales_costing_expense.add_cost_item}
            </Button>
          </Flex>
        </Card.Header>

        <Card.Body>
          <Stack gap={4}>
            {costItems.map((item, idx) => (
              <Box key={item.id} borderWidth="1px" borderRadius="md" p={4}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontWeight="medium">{t.sales_costing_expense.expense_line}</Text>

                  {costItems.length > 1 && (
                    <IconButton aria-label="Remove row" size="xs" variant="ghost" colorScheme="red" onClick={() => handleRemoveRow(item.id)}>
                      <FaTrash color='red'/>
                    </IconButton>
                  )}
                </Flex>

                <SimpleGrid columns={{base: 1, md: 2}} gap={6} mt={5} mb={4}>
                  <Field.Root required>
                    <Field.Label>{t.sales_costing_expense.cost_category}<Field.RequiredIndicator/></Field.Label>
                    <Select.Root collection={costingCategoryCollection} value={item.category ? [item.category] : []} onValueChange={(details) => handleChange(item.id, "category", details.value[0])}>
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder={t.sales_costing_expense.cost_category_placeholder} />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {costingCategoryCollection.items.map((costcategory) => (
                              <Select.Item item={costcategory} key={costcategory.value}>{costcategory.label}<Select.ItemIndicator /></Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label>{t.sales_costing_expense.cost_description} <Field.RequiredIndicator/></Field.Label>
                    <Input placeholder={t.sales_costing_expense.cost_description_placeholder} value={item.description} onChange={(e) => handleChange(item.id, 'description', e.target.value)}/>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_costing_expense.supplier}</Field.Label>
                    <Input placeholder={t.sales_costing_expense.supplier_placeholder} value={item.vendor ?? ''} onChange={(e) => handleChange(item.id, "vendor", e.target.value)}/>
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label>{t.sales_costing_expense.currency} <Field.RequiredIndicator/></Field.Label>
                    <Select.Root collection={currencyCollection} value={item.currency ? [item.currency] : []} onValueChange={(details) => handleChange(item.id, "currency", details.value[0])} width="100%">
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder={t.sales_costing_expense.currency_placeholder} />
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
                </SimpleGrid>
                
                <SimpleGrid columns={{base: 1, lg: 3}} gap={5}>
                    <Field.Root>
                      <Field.Label>{t.sales_costing_expense.exchange_rate}</Field.Label>
                      <Input type="number" value={item.exchangeRate ?? 0} onChange={(e) => handleChange(item.id, "exchangeRate", Number(e.target.value))}/>
                    </Field.Root>
                    <Field.Root required>
                      <Field.Label>{t.sales_costing_expense.amount}<Field.RequiredIndicator/></Field.Label>
                      <Input type="number" value={item.amount ?? 0} onChange={(e) => handleChange(item.id, "amount", Number(e.target.value))}/>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_costing_expense.base_amount}</Field.Label>
                      <Input value={(item.baseAmount ?? 0).toFixed(2)} readOnly/>
                    </Field.Root>
                  </SimpleGrid>

                <Box mt={3}>
                  <Field.Root>
                    <Field.Label>{t.sales_costing_expense.remarks_reference}</Field.Label>
                    <Textarea placeholder={t.sales_costing_expense.remarks_reference_placeholder} value={item.remarks ?? ''} onChange={(e) => handleChange(item.id, 'remarks', e.target.value)}/>
                  </Field.Root>
                </Box>
              </Box>
            ))}

            <Separator />

            <Flex justify="space-between">
              <Text fontWeight="semibold">{t.sales_costing_expense.total_actual_cost}</Text>
                <Text fontWeight="bold">
                  {totalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} USD
                </Text>
            </Flex>
          </Stack>
        </Card.Body>
      </Card.Root>

      {/* Actions */}
      <Flex justify="flex-end" gap={3}>
        <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={handleSaveDraft}>{t.sales_costing_expense.save_draft}</Button>
        <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"}>{t.sales_costing_expense.finalize_actualization}</Button>
      </Flex>
    </Stack>
    </SidebarWithHeader>
    
  );
}

// const costCategoryOptions = createListCollection({
//   items: [
//     { label: "Freight Charge", value: "freight-charge" },
//     { label: "Trucking", value: "trucking" },
//     { label: "Port / Handling", value: "port-handling" },
//     { label: "Customs & Clearance", value: "custom-clearance" },
//     { label: "Warehouse", value: "warehouse" },
//     { label: "Documentation", value: "documentation" },
//     { label: "Other Cost", value: "other-cost" }
//   ],
// })
