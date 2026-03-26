"use client";

import Loading from "@/components/loading";
import CustomerLookup from "@/components/lookup/CustomerLookup";
import SalesOrderLookup from "@/components/lookup/SalesOrderLookup";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { GetCustomerData } from "@/lib/master/customer";
import { getAllItem, GetItemData } from "@/lib/master/item";
import { createSalesProfit, generateSalesProfitNumber } from "@/lib/sales/profit";
import { AlertMessage } from "@/components/ui/alert";
import { GetSalesOrderItemData } from "@/lib/sales/sales-order";
import { Badge, Box, Button, Card, Combobox, createListCollection, Field, Flex, Heading, Input, Portal, Select, Separator, SimpleGrid, Text, useFilter, useListCollection } from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type ProfitMode = "create" | "view" | "edit";

export default function CreateProfitSummaryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProfitSummaryContent />
    </Suspense>
  );
}

function ProfitSummaryContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const searchParams = useSearchParams();
  const profitID = searchParams.get("profit_id");

  const [profitSummaryStatus, setProfitSummaryStatus] = useState<string>();
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();

  const [mode, setMode] = useState<ProfitMode>("create");
  const isReadOnly = mode === "view" && profitSummaryStatus !== "draft" && profitSummaryStatus !== "rejected";

  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState("");
  const [messagePopup, setMessagePopup] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [currencySelected, setCurrencySelected] = useState<string>();
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((cur) => ({
      label: `${cur.currency_name} (${cur.currency_symbol})`,
      value: cur.currency_id,
    })),
  });

  const [itemCollections, setItemCollections] = useState<GetItemData[]>([]);
  const { contains } = useFilter({ sensitivity: "base" });
  const { collection: itemCollection, set: setItemCollection } = useListCollection<GetItemData>({
    initialItems: [],
    itemToString: (item) => `${item.item_code} - ${item.item_name}`,
    itemToValue: (item) => item.item_id,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [salesOrderModalOpen, setSalesOrderModalOpen] = useState(false);
  const [referenceNo, setReferenceNo] = useState("");
  const [jobOrderNo, setJobOrderNo] = useState("");
  const [salesOrderId, setSalesOrderId] = useState("");
  const [customer, setCustomer] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(15000);
  const [exchangeRateInput, setExchangeRateInput] = useState("15,000");

  const selectedCurrencyData = currencyOptions.find((c) => c.currency_id === currencySelected);
  const currencySymbol = selectedCurrencyData?.currency_symbol ?? currency;
  const isIDR = selectedCurrencyData?.currency_symbol === "IDR" || selectedCurrencyData?.currency_code === "IDR";

  const [items, setItems] = useState([
    { id: crypto.randomUUID(), itemName: "", qty: 0, sellingPrice: 0, landedCost: 0, sellingPriceInput: "", landedCostInput: "" },
  ]);

  useEffect(() => {
    const init = async () => {
      const valid = await checkAuthOrRedirect();
      if (!valid) return;
      const info = getAuthInfo();
      setAuth(info);
      const language = info?.language === "id" ? "id" : "en";
      setLang(language);
    };

    const loadMaster = async () => {
      const [currencyRes, itemRes] = await Promise.all([
        getAllCurrency(1, 1000),
        getAllItem(1, 10000),
      ]);
      setCurrencyOptions(currencyRes?.data ?? []);
      const itemData = itemRes?.data ?? [];
      setItemCollection(itemData);
      setItemCollections(itemData);
    };

    const loadDetail = async () => {
      if (!profitID) return;
      // TODO: fetch profit detail by profitID
    };

    const loadGeneratedNumber = async () => {
      if (profitID) return;
      const res = await generateSalesProfitNumber();
      setReferenceNo(res.number);
    };

    const loadAll = async () => {
      try {
        setLoading(true);
        await init();
        await loadMaster();
        await loadDetail();
        await loadGeneratedNumber();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [profitID]);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), itemName: "", qty: 0, sellingPrice: 0, landedCost: 0, sellingPriceInput: "", landedCostInput: "" },
    ]);

  const removeItem = (id: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));

  const updateItem = (id: string, key: string, value: string | number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)));

  const updateFormattedItem = (id: string, field: "sellingPrice" | "landedCost", raw: string) => {
    const inputKey = field === "sellingPrice" ? "sellingPriceInput" : "landedCostInput";
    const numeric = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, [field]: numeric, [inputKey]: raw } : i));
  };

  const blurFormattedItem = (id: string, field: "sellingPrice" | "landedCost") => {
    const inputKey = field === "sellingPrice" ? "sellingPriceInput" : "landedCostInput";
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, [inputKey]: i[field] === 0 ? "" : i[field].toLocaleString() } : i));
  };

  const focusFormattedItem = (id: string, field: "sellingPrice" | "landedCost") => {
    const inputKey = field === "sellingPrice" ? "sellingPriceInput" : "landedCostInput";
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, [inputKey]: i[field] === 0 ? "" : String(i[field]) } : i));
  };

  const totalRevenue = items.reduce((sum, i) => sum + i.qty * i.sellingPrice, 0);
  const totalCost = items.reduce((sum, i) => sum + i.qty * i.landedCost, 0);
  const grossProfit = totalRevenue - totalCost;
  const grossProfitIdr = grossProfit * exchangeRate;

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!referenceNo.trim()) newErrors.sales_profit_no = "Required";
    if (!salesOrderId) newErrors.sales_order_id = "Required";
    if (!customerId) newErrors.customer_id = "Required";
    if (!currencySelected) newErrors.currency_id = "Required";
    if (items.length === 0) newErrors.items = "At least one item is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await createSalesProfit({
        sales_profit_no: referenceNo,
        sales_order_id: salesOrderId,
        customer_id: customerId,
        currency_id: currencySelected!,
        exchange_rate_to_idr: String(exchangeRate),
        revenue_total_usd: String(totalRevenue),
        cost_total_usd: String(totalCost),
        gross_profit_usd: String(grossProfit),
        gross_profit_idr: String(grossProfitIdr),
        items: items.map((i) => ({
          item_id: i.itemName,
          quantity: String(i.qty),
          landed_cost: String(i.landedCost),
          selling_price: String(i.sellingPrice),
        })),
      });

      setShowAlert(true);
      setIsSuccess(true);
      setTitlePopup(t.master.success);
      setMessagePopup(t.sales_profit_summary.success_create);

      // Reset form
      const newNumber = await generateSalesProfitNumber();
      setReferenceNo(newNumber.number);
      setJobOrderNo("");
      setSalesOrderId("");
      setCustomer("");
      setCustomerId("");
      setCurrencySelected(undefined);
      setExchangeRate(15000);
      setExchangeRateInput("15,000");
      setItems([{ id: crypto.randomUUID(), itemName: "", qty: 0, sellingPrice: 0, landedCost: 0, sellingPriceInput: "", landedCostInput: "" }]);
      setErrors({});

      setTimeout(() => setShowAlert(false), 6000);
    } catch (err: any) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(err.message || t.sales_profit_summary.success_create);
      setTimeout(() => setShowAlert(false), 6000);
    } finally {
      setLoading(false);
    }
  };

  const handleChooseCustomer = (selectedCustomer: GetCustomerData) => {
    setCustomer(selectedCustomer.customer_name);
    setCustomerId(selectedCustomer.customer_id);
    setErrors((prev) => ({ ...prev, customer_id: "" }));
    setCustomerModalOpen(false);
  };

  const handleChooseSalesOrder = (selectedSalesOrder: GetSalesOrderItemData) => {
    setJobOrderNo(selectedSalesOrder.sales_order_no);
    setSalesOrderId(selectedSalesOrder.sales_order_id);
    setErrors((prev) => ({ ...prev, sales_order_id: "" }));
    setSalesOrderModalOpen(false);
  };

  if (loading) return <Loading />;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading size="lg" mb={4}>{t.sales_profit_summary.title_create}</Heading>

      <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
      <SalesOrderLookup isOpen={salesOrderModalOpen} onClose={() => setSalesOrderModalOpen(false)} onChoose={handleChooseSalesOrder} />

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

      {/* Header Information */}
      <Card.Root mb={6}>
        <Card.Header>
          <Heading size="md">{t.sales_profit_summary.header_information}</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Field.Root invalid={!!errors.sales_profit_no} required>
              <Field.Label>{t.sales_profit_summary.reference_no}<Field.RequiredIndicator /></Field.Label>
              <Input placeholder={t.sales_profit_summary.reference_no_placeholder} value={referenceNo} onChange={(e) => { setReferenceNo(e.target.value); setErrors((p) => ({ ...p, sales_profit_no: "" })); }} />
              {errors.sales_profit_no && <Field.ErrorText>{errors.sales_profit_no}</Field.ErrorText>}
            </Field.Root>
            <Field.Root invalid={!!errors.sales_order_id} required>
              <Field.Label>{t.sales_profit_summary.job_order_booking}<Field.RequiredIndicator /></Field.Label>
              <Input placeholder={t.sales_profit_summary.job_order_booking_placeholder} value={jobOrderNo} readOnly cursor="pointer" onClick={() => setSalesOrderModalOpen(true)} />
              {errors.sales_order_id && <Field.ErrorText>{errors.sales_order_id}</Field.ErrorText>}
            </Field.Root>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: isIDR ? 2 : 3 }} gap={5} mt={4}>
            <Field.Root invalid={!!errors.customer_id} required>
              <Field.Label>{t.sales_profit_summary.customer}<Field.RequiredIndicator /></Field.Label>
              <Input placeholder={t.sales_profit_summary.customer_placeholder} value={customer} readOnly cursor="pointer" onClick={() => setCustomerModalOpen(true)} />
              {errors.customer_id && <Field.ErrorText>{errors.customer_id}</Field.ErrorText>}
            </Field.Root>
            <Field.Root invalid={!!errors.currency_id} required>
              <Field.Label>{t.sales_profit_summary.currency}<Field.RequiredIndicator /></Field.Label>
              <Select.Root w="100%" collection={currencyCollection} value={currencySelected ? [currencySelected] : []} onValueChange={(details) => { setCurrencySelected(details.value[0]); setErrors((p) => ({ ...p, currency_id: "" })); }}>
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.sales_profit_summary.currency_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {currencyCollection.items.map((cur) => (
                        <Select.Item item={cur} key={cur.value}>
                          {cur.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
              {errors.currency_id && <Field.ErrorText>{errors.currency_id}</Field.ErrorText>}
            </Field.Root>
            {!isIDR && (
              <Field.Root>
                <Field.Label>{t.sales_profit_summary.exchange_rate}</Field.Label>
                <Input
                  value={exchangeRateInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setExchangeRateInput(raw);
                    setExchangeRate(parseFloat(raw.replace(/[^0-9.]/g, "")) || 0);
                  }}
                  onBlur={() => setExchangeRateInput(exchangeRate === 0 ? "" : exchangeRate.toLocaleString())}
                  onFocus={() => setExchangeRateInput(exchangeRate === 0 ? "" : String(exchangeRate))}
                />
              </Field.Root>
            )}
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      {/* Items */}
      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Flex align="center" gap={2}>
              <Heading size="md">{t.sales_profit_summary.items_section}</Heading>
              <Text color="red.500" fontSize="sm">*</Text>
              {errors.items && <Text color="red.500" fontSize="sm">{errors.items}</Text>}
            </Flex>
            <Button size="sm" bg="#E77A1F" color="white" onClick={() => { addItem(); setErrors((p) => ({ ...p, items: "" })); }}>{t.sales_profit_summary.add_item}</Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          <Box overflowX="auto">
            {items.map((item) => (
              <SimpleGrid templateColumns="350px 150px 180px 180px 180px 100px" key={item.id} gap={5} mb={3}>
                <Field.Root>
                  <Field.Label>{t.sales_profit_summary.product_services}</Field.Label>
                  <Combobox.Root
                    collection={itemCollection}
                    onValueChange={(details) => updateItem(item.id, "itemName", details.value?.[0] ?? "")}
                    onInputValueChange={(e) => {
                      const input = e.inputValue ?? "";
                      if (!input.trim()) { setItemCollection(itemCollections); return; }
                      setItemCollection(itemCollections.filter((i) => contains(`${i.item_code} - ${i.item_name}`, input)));
                    }}
                  >
                    <Combobox.Control>
                      <Combobox.Input placeholder={t.sales_profit_summary.product_services_placeholder} onFocus={() => setItemCollection(itemCollections)} />
                      <Combobox.IndicatorGroup>
                        <Combobox.ClearTrigger />
                        <Combobox.Trigger />
                      </Combobox.IndicatorGroup>
                    </Combobox.Control>
                    <Portal>
                      <Combobox.Positioner>
                        <Combobox.Content>
                          <Combobox.Empty>No items found</Combobox.Empty>
                          {itemCollection.items.map((i) => (
                            <Combobox.Item item={i} key={i.item_id}>
                              {i.item_code} - {i.item_name}
                              <Combobox.ItemIndicator />
                            </Combobox.Item>
                          ))}
                        </Combobox.Content>
                      </Combobox.Positioner>
                    </Portal>
                  </Combobox.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t.sales_profit_summary.qty}</Field.Label>
                  <Input
                    type="number"
                    placeholder={t.sales_profit_summary.qty}
                    value={item.qty === 0 ? "" : item.qty}
                    onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t.sales_profit_summary.selling_price}</Field.Label>
                  <Input
                    placeholder={t.sales_profit_summary.selling_price}
                    value={item.sellingPriceInput}
                    onChange={(e) => updateFormattedItem(item.id, "sellingPrice", e.target.value)}
                    onBlur={() => blurFormattedItem(item.id, "sellingPrice")}
                    onFocus={() => focusFormattedItem(item.id, "sellingPrice")}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t.sales_profit_summary.landed_cost}</Field.Label>
                  <Input
                    placeholder={t.sales_profit_summary.landed_cost}
                    value={item.landedCostInput}
                    onChange={(e) => updateFormattedItem(item.id, "landedCost", e.target.value)}
                    onBlur={() => blurFormattedItem(item.id, "landedCost")}
                    onFocus={() => focusFormattedItem(item.id, "landedCost")}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t.sales_profit_summary.profit}</Field.Label>
                  <Text>
                    {(item.qty * (item.sellingPrice - item.landedCost)).toLocaleString()}
                    ({item.sellingPrice > 0 ? (((item.sellingPrice - item.landedCost) / item.sellingPrice) * 100).toFixed(2) : 0}%)
                  </Text>
                </Field.Root>
                <Flex align="flex-end">
                  <Button color="red" variant="ghost" onClick={() => removeItem(item.id)}>{t.sales_profit_summary.delete}</Button>
                </Flex>
              </SimpleGrid>
            ))}
          </Box>

          <Separator />

          <Flex justify="space-between" mt={3}>
            <Text fontWeight="semibold">{t.sales_profit_summary.revenue_total} ({currencySymbol})</Text>
            <Text fontWeight="bold">{totalRevenue.toLocaleString()}</Text>
          </Flex>
          <Flex justify="space-between" mt={2}>
            <Text fontWeight="semibold">{t.sales_profit_summary.cost_total} ({currencySymbol})</Text>
            <Text fontWeight="bold">{totalCost.toLocaleString()}</Text>
          </Flex>
          <Flex justify="space-between" mt={2}>
            <Text fontWeight="semibold">{t.sales_profit_summary.margin}</Text>
            <Text fontWeight="bold">{totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : 0}%</Text>
          </Flex>
        </Card.Body>
      </Card.Root>

      {/* Result Section */}
      <Card.Root mt={5}>
        <Card.Header>
          <Heading size="md">{t.sales_profit_summary.result_section}</Heading>
        </Card.Header>
        <Card.Body>
          <Flex justify="space-between" mb={2}>
            <Text>{t.sales_profit_summary.gross_profit} ({currencySymbol})</Text>
            <Text fontWeight="bold">{grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </Flex>
          {!isIDR && (
            <Flex justify="space-between">
              <Text fontSize="md">{t.sales_profit_summary.gross_profit_idr}</Text>
              <Text fontSize="md" fontWeight="bold">{grossProfitIdr.toLocaleString()}</Text>
            </Flex>
          )}
        </Card.Body>
      </Card.Root>

      {/* Actions */}
      <Flex justify="flex-end" mt={8} gap={3}>
        <Button variant="outline">{t.sales_profit_summary.cancel}</Button>
        <Button bg="#E77A1F" color="white" cursor="pointer" onClick={handleSubmit}>{t.sales_profit_summary.save}</Button>
      </Flex>

    </SidebarWithHeader>
  );
}