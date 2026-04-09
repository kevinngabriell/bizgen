'use client';

import { Suspense, useEffect, useState } from 'react';
import { Badge, Box, Button, Card, Flex, Heading, IconButton, Input, Stack, Text, Textarea, SimpleGrid, Separator, createListCollection, Select, Portal, Field } from '@chakra-ui/react';
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
import { createSalesCosting, generateSalesCostingNumber, getDetailSalesCosting, updateSalesCosting, GetDetailCostingHistory } from '@/lib/sales/costing';
import { AlertMessage } from '@/components/ui/alert';
import { GetSalesBookingData } from '@/lib/sales/booking-confirmation';
import SalesBookingLookup from '@/components/lookup/SalesJoborderLookup';
import { getAllCostingCategory, GetCostingCategoryData } from '@/lib/master/costing-category';

type CostingMode = "create" | "view" | "edit";

const defaultItem = () => ({
  id: crypto.randomUUID(),
  category: '',
  description: '',
  vendor: '',
  currency: '',
  amount: 0,
  exchangeRate: 0,
  baseAmount: 0,
  remarks: '',
});

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

  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const searchParams = useSearchParams();
  const costingID = searchParams.get("costing_id");

  const [costingDetailId, setCostingDetailId] = useState<string>();
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();
  const [historyData, setHistoryData] = useState<GetDetailCostingHistory[]>([]);

  const [mode, setMode] = useState<CostingMode>("create");
  // costing has no status workflow — editable only in create/edit mode
  const isReadOnly = mode === "view";

  // customer lookup
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<GetCustomerData | null>(null);

  // ship via
  const [shipmentTypeSelected, setShipmentTypeSelected] = useState<string>();
  const [shipmentTypeOptions, setShipmentTypeOptions] = useState<GetShipViaData[]>([]);

  const shipmentTypeCollection = createListCollection({
    items: shipmentTypeOptions.map((s) => ({
      label: s.ship_via_name,
      value: s.ship_via_id,
    })),
  });

  // currency
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((cur) => ({
      label: `${cur.currency_name} (${cur.currency_symbol})`,
      value: cur.currency_id,
    })),
  });

  // ports
  const [originSelected, setOriginSelected] = useState<string>();
  const [destinationSelected, setDestinationSelected] = useState<string>();
  const [portOptions, setPortOptions] = useState<GetPortData[]>([]);

  const portCollection = createListCollection({
    items: portOptions.map((port) => ({
      label: `${port.port_name} -  ${port.origin_name}`,
      value: port.port_id,
    })),
  });

  // costing categories
  const [costingCategoryOptions, setCostingCategoryOptions] = useState<GetCostingCategoryData[]>([]);

  const costingCategoryCollection = createListCollection({
    items: costingCategoryOptions.map((cc) => ({
      label: cc.costing_category_name,
      value: cc.costing_category_id,
    })),
  });

  // job order lookup
  const [jobOrderModalOpen, setJobOrderModalOpen] = useState(false);
  const [selectedJobOrder, setSelectedJobOrder] = useState<GetSalesBookingData | null>(null);
  const [linkedJobOrder, setLinkedJobOrder] = useState("");
  const [linkedJobOrderID, setLinkedJobOrderID] = useState("");

  // alert
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const showSuccess = (msg: string) => {
    setShowAlert(true); setIsSuccess(true);
    setTitlePopup(t.master.success); setMessagePopup(msg);
    setTimeout(() => setShowAlert(false), 6000);
  };

  const showError = (msg: string) => {
    setShowAlert(true); setIsSuccess(false);
    setTitlePopup(t.master.error); setMessagePopup(msg);
    setTimeout(() => setShowAlert(false), 6000);
  };

  const [shipmentInfo, setShipmentInfo] = useState({
    costingNo: '',
    notes: '',
  });

  const [costItems, setCostItems] = useState([defaultItem()]);

  const totalAmount = costItems.reduce((sum, c) => sum + (c.baseAmount || 0), 0);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if (!valid) return;
        const info = getAuthInfo();
        setAuth(info);
        const language = info?.language === "id" ? "id" : "en";
        setLang(language);

        const [currencyRes, shipViaRes, portRes, costingCatRes] = await Promise.all([
          getAllCurrency(1, 1000),
          getAllShipVia(1, 1000),
          getAllPort(1, 1000),
          getAllCostingCategory(1, 1000),
        ]);

        const currencyData    = currencyRes?.data     ?? [];
        const shipViaData     = shipViaRes?.data      ?? [];
        const portData        = portRes?.data         ?? [];
        const costingCatData  = costingCatRes?.data   ?? [];

        setCurrencyOptions(currencyData);
        setShipmentTypeOptions(shipViaData);
        setPortOptions(portData);
        setCostingCategoryOptions(costingCatData);

        if (costingID) {
          setMode("view");
          const res = await getDetailSalesCosting(costingID);

          setCostingDetailId(res.header.sales_costing_expense_id);
          setLastUpdatedAt(res.header.updated_at ?? res.header.created_at);
          setLastUpdatedBy(res.header.updated_by ?? res.header.created_by)

          setShipmentInfo({
            costingNo: res.header.sales_costing_no,
            notes:     res.header.notes ?? "",
          });

          // match IDs by name
          const matchedShipVia = shipViaData.find(sv => sv.ship_via_name === res.header.ship_via_name);
          if (matchedShipVia) setShipmentTypeSelected(matchedShipVia.ship_via_id);

          const matchedOrigin = portData.find(p => p.port_name === res.header.origin_port_name);
          if (matchedOrigin) setOriginSelected(matchedOrigin.port_id);

          const matchedDest = portData.find(p => p.port_name === res.header.destination_port_name);
          if (matchedDest) setDestinationSelected(matchedDest.port_id);

          // customer — display name only (not updatable)
          if (res.header.customer_name) {
            setSelectedCustomer({
              customer_id:          "",
              customer_name:        res.header.customer_name,
              customer_phone:       "",
              customer_address:     "",
              customer_pic_name:    "",
              customer_pic_contact: "",
              customer_top:         0,
              created_by:           "",
              created_at:           "",
              updated_by:           "",
              updated_at:           "",
              company_id:           "",
            });
          }

          // populate cost items from detail
          if (res.items && res.items.length > 0) {
            const populated = res.items.map(item => {
              const matchedCat = costingCatData.find(cc => cc.costing_category_name === item.costing_category_name);
              const matchedCur = currencyData.find(cur => cur.currency_code === item.currency_code);
              const amount = Number(item.amount);
              const exchangeRate = Number(item.exchange_rate);
              return {
                id:           crypto.randomUUID(),
                category:     matchedCat?.costing_category_id ?? "",
                description:  item.description,
                vendor:       item.supplier ?? "",
                currency:     matchedCur?.currency_id ?? "",
                amount,
                exchangeRate,
                baseAmount:   amount * (exchangeRate || 1),
                remarks:      "",
              };
            });
            setCostItems(populated);
          }

          setHistoryData(res.history ?? []);
        } else {
          const res = await generateSalesCostingNumber();
          setShipmentInfo(prev => ({ ...prev, costingNo: res.number }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [costingID]);

  const handleChooseJobOrder = async (job_order: GetSalesBookingData) => {
    try {
      setLoading(true);
      setSelectedJobOrder(job_order);
      setLinkedJobOrder(job_order.job_order_no);
      setLinkedJobOrderID(job_order.job_order_id);
    } catch (error) {
      console.error("Failed to bind job order", error);
    } finally {
      setLoading(false);
      setJobOrderModalOpen(false);
    }
  };

  const handleChooseCustomer = (customer: GetCustomerData) => {
    setSelectedCustomer(customer);
    setCustomerModalOpen(false);
  };

  const handleAddRow = () => {
    setCostItems(prev => [...prev, defaultItem()]);
  };

  const handleRemoveRow = (id: string) => {
    setCostItems(prev => prev.filter(c => c.id !== id));
  };

  const handleChange = (id: string, field: string, value: any) => {
    setCostItems(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: value };
      const amount = Number(updated.amount) || 0;
      const rate   = Number(updated.exchangeRate) || 1;
      updated.baseAmount = amount * rate;
      return updated;
    }));
  };

  const handleSaveDraft = async () => {
    try {
      if (!shipmentInfo.costingNo)        throw new Error(t.sales_costing_expense.error_1);
      if (!linkedJobOrderID)              throw new Error(t.sales_costing_expense.error_2);
      if (!selectedCustomer?.customer_id) throw new Error(t.sales_costing_expense.error_3);
      if (!shipmentTypeSelected)          throw new Error(t.sales_costing_expense.error_4);
      if (!originSelected)                throw new Error(t.sales_costing_expense.error_5);
      if (!destinationSelected)           throw new Error(t.sales_costing_expense.error_6);
      if (originSelected === destinationSelected) throw new Error(t.sales_costing_expense.error_7);
      if (costItems.length === 0)         throw new Error(t.sales_costing_expense.error_8);

      setLoading(true);

      await createSalesCosting({
        sales_costing_no:  shipmentInfo.costingNo,
        booking_no:        linkedJobOrderID,
        customer_id:       selectedCustomer.customer_id,
        ship_via_id:       shipmentTypeSelected,
        origin_port:       originSelected,
        destination_port:  destinationSelected,
        notes:             shipmentInfo.notes,
        items: costItems.map(row => ({
          costing_category_id: row.category,
          description:         row.description,
          supplier:            row.vendor,
          notes:               row.description,
          currency_id:         row.currency,
          exchange_rate:       String(row.exchangeRate ?? 0),
          amount:              String(row.amount ?? 0),
        })),
      });

      showSuccess(t.sales_costing_expense.success_draft);

      // reset
      const newNum = await generateSalesCostingNumber();
      setShipmentInfo({ costingNo: newNum.number, notes: '' });
      setShipmentTypeSelected(undefined);
      setOriginSelected(undefined);
      setDestinationSelected(undefined);
      setLinkedJobOrder("");
      setLinkedJobOrderID("");
      setSelectedCustomer(null);
      setCostItems([defaultItem()]);
    } catch (err: any) {
      showError(err.message || t.sales_costing_expense.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!costingDetailId) throw new Error("Costing ID not found");
      setLoading(true);

      await updateSalesCosting({
        costing_id:       costingDetailId,
        booking_no:       linkedJobOrderID || undefined,
        ship_via_id:      shipmentTypeSelected,
        origin_port:      originSelected,
        destination_port: destinationSelected,
        notes:            shipmentInfo.notes,
      });

      showSuccess("Costing updated successfully.");
      setMode("view");
    } catch (err: any) {
      showError(err.message || "Failed to update costing.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>

      <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
      <SalesBookingLookup isOpen={jobOrderModalOpen} onClose={() => setJobOrderModalOpen(false)} onChoose={handleChooseJobOrder} />

      <Stack gap={6}>
        <Flex justify="space-between" align="center">
          <Flex direction="column">
            <Heading size="lg">{t.sales_costing_expense.title}</Heading>
            <Text color="gray.600" fontSize="sm">{t.sales_costing_expense.description}</Text>
          </Flex>
          {mode === "view" && (
            <Button bg="#E77A1F" color="white" onClick={() => setMode("edit")}>
              {t.sales_shipment_process.edit}
            </Button>
          )}
        </Flex>

        {mode === "view" && (
          <Card.Root>
            <Card.Body>
              <Flex justifyContent="space-between">
                <Badge variant="solid" colorPalette="green">Active</Badge>
                <Text fontSize="xs" color="gray.600">
                  {t.master.last_update_by} <b>{lastUpdatedBy ?? "System"}</b> •{" "} {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                </Text>
              </Flex>
            </Card.Body>
          </Card.Root>
        )}

        {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

        {/* Shipment Context */}
        <Card.Root variant="outline">
          <Card.Header>
            <Heading size="md">{t.sales_costing_expense.shipment_context}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root required>
                <Field.Label>{t.sales_costing_expense.costing_number}<Field.RequiredIndicator /></Field.Label>
                <Input placeholder={t.sales_costing_expense.costing_number_placeholder} value={shipmentInfo.costingNo} readOnly={isReadOnly} onChange={(e) => setShipmentInfo({ ...shipmentInfo, costingNo: e.target.value })}/>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_costing_expense.job_booking_number}<Field.RequiredIndicator /></Field.Label>
                <Input placeholder={t.sales_shipment_process.job_booking_no_placeholder} value={linkedJobOrder} readOnly cursor={isReadOnly ? "default" : "pointer"} onClick={() => !isReadOnly && setJobOrderModalOpen(true)}/>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_costing_expense.customer}<Field.RequiredIndicator /></Field.Label>
                <Input placeholder={t.sales_costing_expense.customer_placeholder} value={selectedCustomer?.customer_name ?? ""} readOnly cursor={isReadOnly ? "default" : "pointer"} onClick={() => !isReadOnly && setCustomerModalOpen(true)}/>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_costing_expense.shipment_type}<Field.RequiredIndicator /></Field.Label>
                <Select.Root disabled={isReadOnly} collection={shipmentTypeCollection} value={shipmentTypeSelected ? [shipmentTypeSelected] : []} onValueChange={(details) => setShipmentTypeSelected(details.value[0])}>
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_costing_expense.shipment_type_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {shipmentTypeCollection.items.map((s) => (
                          <Select.Item item={s} key={s.value}>{s.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_costing_expense.origin_port}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  disabled={isReadOnly}
                  collection={portCollection}
                  value={originSelected ? [originSelected] : []}
                  onValueChange={(details) => setOriginSelected(details.value[0])}
                  width="100%"
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_costing_expense.origin_port_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
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
                <Field.Label>{t.sales_costing_expense.destination_port}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  disabled={isReadOnly}
                  collection={portCollection}
                  value={destinationSelected ? [destinationSelected] : []}
                  onValueChange={(details) => setDestinationSelected(details.value[0])}
                  width="100%"
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_costing_expense.destination_port_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
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
              <Textarea
                placeholder={t.sales_costing_expense.notes_optional_placeholder}
                rows={3}
                value={shipmentInfo.notes}
                readOnly={isReadOnly}
                onChange={(e) => setShipmentInfo({ ...shipmentInfo, notes: e.target.value })}
              />
            </Field.Root>
          </Card.Body>
        </Card.Root>

        {/* Cost Items */}
        <Card.Root variant="outline">
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Heading size="md">{t.sales_costing_expense.actual_expense_items}</Heading>
              {!isReadOnly && (
                <Button size="sm" variant="solid" bg="#E77A1F" color="white" cursor="pointer" onClick={handleAddRow}>
                  {t.sales_costing_expense.add_cost_item}
                </Button>
              )}
            </Flex>
          </Card.Header>
          <Card.Body>
            <Stack gap={4}>
              {costItems.map((item) => (
                <Box key={item.id} borderWidth="1px" borderRadius="md" p={4}>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontWeight="medium">{t.sales_costing_expense.expense_line}</Text>
                    {!isReadOnly && costItems.length > 1 && (
                      <IconButton aria-label="Remove row" size="xs" variant="ghost" colorScheme="red" onClick={() => handleRemoveRow(item.id)}>
                        <FaTrash color="red" />
                      </IconButton>
                    )}
                  </Flex>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mt={5} mb={4}>
                    <Field.Root required>
                      <Field.Label>{t.sales_costing_expense.cost_category}<Field.RequiredIndicator /></Field.Label>
                      <Select.Root
                        disabled={isReadOnly}
                        collection={costingCategoryCollection}
                        value={item.category ? [item.category] : []}
                        onValueChange={(details) => handleChange(item.id, "category", details.value[0])}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder={t.sales_costing_expense.cost_category_placeholder} />
                          </Select.Trigger>
                          <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {costingCategoryCollection.items.map((cc) => (
                                <Select.Item item={cc} key={cc.value}>{cc.label}<Select.ItemIndicator /></Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    </Field.Root>
                    <Field.Root required>
                      <Field.Label>{t.sales_costing_expense.cost_description}<Field.RequiredIndicator /></Field.Label>
                      <Input
                        placeholder={t.sales_costing_expense.cost_description_placeholder}
                        value={item.description}
                        readOnly={isReadOnly}
                        onChange={(e) => handleChange(item.id, 'description', e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_costing_expense.supplier}</Field.Label>
                      <Input
                        placeholder={t.sales_costing_expense.supplier_placeholder}
                        value={item.vendor ?? ''}
                        readOnly={isReadOnly}
                        onChange={(e) => handleChange(item.id, "vendor", e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root required>
                      <Field.Label>{t.sales_costing_expense.currency}<Field.RequiredIndicator /></Field.Label>
                      <Select.Root
                        disabled={isReadOnly}
                        collection={currencyCollection}
                        value={item.currency ? [item.currency] : []}
                        onValueChange={(details) => handleChange(item.id, "currency", details.value[0])}
                        width="100%"
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder={t.sales_costing_expense.currency_placeholder} />
                          </Select.Trigger>
                          <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {currencyCollection.items.map((cur) => (
                                <Select.Item item={cur} key={cur.value}>{cur.label}<Select.ItemIndicator /></Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    </Field.Root>
                  </SimpleGrid>
                  <SimpleGrid columns={{ base: 1, lg: 3 }} gap={5}>
                    <Field.Root>
                      <Field.Label>{t.sales_costing_expense.exchange_rate}</Field.Label>
                      <Input
                        type="number"
                        value={item.exchangeRate ?? 0}
                        readOnly={isReadOnly}
                        onChange={(e) => handleChange(item.id, "exchangeRate", Number(e.target.value))}
                      />
                    </Field.Root>
                    <Field.Root required>
                      <Field.Label>{t.sales_costing_expense.amount}<Field.RequiredIndicator /></Field.Label>
                      <Input type="number"
                        value={item.amount ?? 0}
                        readOnly={isReadOnly}
                        onChange={(e) => handleChange(item.id, "amount", Number(e.target.value))}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_costing_expense.base_amount}</Field.Label>
                      <Input value={(item.baseAmount ?? 0).toFixed(2)} readOnly />
                    </Field.Root>
                  </SimpleGrid>
                  <Box mt={3}>
                    <Field.Root>
                      <Field.Label>{t.sales_costing_expense.remarks_reference}</Field.Label>
                      <Textarea placeholder={t.sales_costing_expense.remarks_reference_placeholder} value={item.remarks ?? ''} readOnly={isReadOnly} onChange={(e) => handleChange(item.id, 'remarks', e.target.value)}/>
                    </Field.Root>
                  </Box>
                </Box>
              ))}

              <Separator />

              <Flex justify="space-between">
                <Text fontWeight="semibold">{t.sales_costing_expense.total_actual_cost}</Text>
                <Text fontWeight="bold">
                  {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </Text>
              </Flex>
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* Action buttons */}
        {mode === "create" && (
          <Flex justify="flex-end" gap={3}>
            <Button variant="outline" bg="transparent" borderColor="#E77A1F" color="#E77A1F" cursor="pointer" onClick={handleSaveDraft}>
              {t.sales_costing_expense.save_draft}
            </Button>
            <Button bg="#E77A1F" color="white" cursor="pointer" onClick={handleSaveDraft}>
              {t.sales_costing_expense.finalize_actualization}
            </Button>
          </Flex>
        )}

        {mode === "edit" && (
          <Flex justify="flex-end" gap={3}>
            <Button variant="outline" onClick={() => setMode("view")}>{t.master.cancel}</Button>
            <Button bg="#E77A1F" color="white" onClick={handleUpdate}>{t.master.save}</Button>
          </Flex>
        )}

        {/* History log */}
        {mode !== "create" && historyData.length > 0 && (
          <Card.Root>
            <Card.Body>
              <Heading size="xl" mb={3}>History Log</Heading>
              {historyData.map((log, index) => (
                <Flex key={index} justify="space-between" mb={2}>
                  <Text fontSize="sm">
                    {log.note} by <b>{log.created_by}</b>
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {log.created_at ? new Date(log.created_at).toLocaleString(
                          lang === "id" ? "id-ID" : "en-US",
                          { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }
                        )
                      : "-"}
                  </Text>
                </Flex>
              ))}
            </Card.Body>
          </Card.Root>
        )}
      </Stack>
    </SidebarWithHeader>
  );
}
