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
import {
  createSalesProfit,
  generateSalesProfitNumber,
  getDetailSalesProfit,
  updateSalesProfit,
  processSalesProfitAction,
  GetDetailProfitHistory,
} from "@/lib/sales/profit";
import { AlertMessage } from "@/components/ui/alert";
import { GetSalesOrderItemData } from "@/lib/sales/sales-order";
import RejectDialog from "@/components/dialog/RejectDialog";
import {
  Badge, Box, Button, Card, Combobox, createListCollection, Field, Flex,
  Heading, Input, Portal, Select, Separator, SimpleGrid, Text, useFilter, useListCollection,
} from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type ProfitMode = "create" | "view";

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
  const [profitDetailId, setProfitDetailId] = useState<string>("");
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();

  const [mode, setMode] = useState<ProfitMode>("create");
  // Only lock when status is explicitly submitted or confirmed
  const isReadOnly = mode === "view" && (profitSummaryStatus === "submitted" || profitSummaryStatus === "confirmed");

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

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
  const [historyData, setHistoryData] = useState<GetDetailProfitHistory[]>([]);

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
    { id: crypto.randomUUID(), revenueItemId: "", itemName: "", itemDisplayName: "", qty: 0, sellingPrice: 0, landedCost: 0, sellingPriceInput: "", landedCostInput: "" },
  ]);

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

  useEffect(() => {
    const init = async () => {
      const valid = await checkAuthOrRedirect();
      if (!valid) return;
      const info = getAuthInfo();
      setAuth(info);
      const language = info?.language === "id" ? "id" : "en";
      setLang(language);
    };

    const loadAll = async () => {
      try {
        setLoading(true);
        await init();

        const [currencyRes, itemRes] = await Promise.all([
          getAllCurrency(1, 1000),
          getAllItem(1, 10000),
        ]);

        const currencyData = currencyRes?.data ?? [];
        const itemData = itemRes?.data ?? [];

        setCurrencyOptions(currencyData);
        setItemCollection(itemData);
        setItemCollections(itemData);

        if (profitID) {
          setMode("view");
          const res = await getDetailSalesProfit(profitID);
          const h = res.header as any;

          setProfitDetailId(h.profit_summary_id);
          setReferenceNo(h.sales_profit_no ?? "");
          setJobOrderNo(h.sales_order_no ?? "");
          setCustomer(h.customer_name ?? "");
          setProfitSummaryStatus(h.status?.toLowerCase() ?? "");
          setLastUpdatedBy(h.updated_by ?? "");
          setLastUpdatedAt(h.updated_at ?? "");

          const rate = Number(h.exchange_rate_to_idr) || 15000;
          setExchangeRate(rate);
          setExchangeRateInput(rate.toLocaleString());

          // Match currency by code
          const matchedCurrency = currencyData.find(
            (c) => c.currency_code === h.currency_code || c.currency_symbol === h.currency_code
          );
          if (matchedCurrency) {
            setCurrencySelected(matchedCurrency.currency_id);
            setCurrency(matchedCurrency.currency_symbol);
          }

          // Map items for display — match item_id from master data so the Combobox can resolve the value
          setItems(
            res.items.map((item) => {
              const matched = itemData.find((i) => i.item_name === item.item_name);
              return {
                id: crypto.randomUUID(),
                revenueItemId: item.revenue_item_id ?? "",
                itemName: matched?.item_id ?? "",
                itemDisplayName: item.item_name,
                qty: item.quantity,
                sellingPrice: item.selling_price,
                landedCost: item.landed_cost,
                sellingPriceInput: item.selling_price.toLocaleString(),
                landedCostInput: item.landed_cost.toLocaleString(),
              };
            })
          );

          setHistoryData(res.history);
        } else {
          const res = await generateSalesProfitNumber();
          setReferenceNo(res.number);
        }
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
      { id: crypto.randomUUID(), revenueItemId: "", itemName: "", itemDisplayName: "", qty: 0, sellingPrice: 0, landedCost: 0, sellingPriceInput: "", landedCostInput: "" },
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

      showSuccess(t.sales_profit_summary.success_create);

      const newNumber = await generateSalesProfitNumber();
      setReferenceNo(newNumber.number);
      setJobOrderNo("");
      setSalesOrderId("");
      setCustomer("");
      setCustomerId("");
      setCurrencySelected(undefined);
      setExchangeRate(15000);
      setExchangeRateInput("15,000");
      setItems([{ id: crypto.randomUUID(), revenueItemId: "", itemName: "", itemDisplayName: "", qty: 0, sellingPrice: 0, landedCost: 0, sellingPriceInput: "", landedCostInput: "" }]);
      setErrors({});
    } catch (err: any) {
      showError(err.message || t.sales_profit_summary.success_create);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!profitDetailId) throw new Error("Profit Summary ID not found");
      setLoading(true);

      await updateSalesProfit({
        profit_id: profitDetailId,
        exchange_rate_to_idr: String(exchangeRate),
        revenue_total_usd: String(totalRevenue),
        cost_total_usd: String(totalCost),
        gross_profit_usd: String(grossProfit),
        gross_profit_idr: String(grossProfitIdr),
        items: items.map((i) => ({
          revenue_item_id: i.revenueItemId || undefined,
          item_id: i.itemName,
          quantity: String(i.qty),
          landed_cost: String(i.landedCost),
          selling_price: String(i.sellingPrice),
        })),
      });

      showSuccess(t.sales_profit_summary.success_update);
    } catch (err: any) {
      showError(err.message || "Failed to update profit summary.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProfit = async () => {
    try {
      if (!profitDetailId) throw new Error("Profit Summary ID not found");
      setLoading(true);

      await processSalesProfitAction({ profit_id: profitDetailId, action: "submit" });

      setProfitSummaryStatus("submitted");
      showSuccess("Profit summary submitted successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to submit profit summary.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      if (!profitDetailId) throw new Error("Profit Summary ID not found");
      setLoading(true);

      await processSalesProfitAction({ profit_id: profitDetailId, action: "approve" });

      setProfitSummaryStatus("confirmed");
      showSuccess("Profit summary approved successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to approve profit summary.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      if (!profitDetailId) throw new Error("Profit Summary ID not found");
      setRejectLoading(true);

      await processSalesProfitAction({ profit_id: profitDetailId, action: "reject", notes: reason });

      setIsRejectDialogOpen(false);
      setProfitSummaryStatus("cancelled");
      showSuccess("Profit summary rejected successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to reject profit summary.");
    } finally {
      setRejectLoading(false);
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
    <>
      <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
        <Heading size="lg" mb={4}>
          {mode === "create" ? t.sales_profit_summary.title_create : t.sales_profit_summary.title_view}
        </Heading>

        <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
        <SalesOrderLookup isOpen={salesOrderModalOpen} onClose={() => setSalesOrderModalOpen(false)} onChoose={handleChooseSalesOrder} />

        {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

        {mode === "view" && (
          <Card.Root mb={4}>
            <Card.Body>
              <Flex justifyContent="space-between">
                <Badge
                  variant="solid"
                  colorPalette={
                    profitSummaryStatus === "confirmed" ? "green"
                    : profitSummaryStatus === "cancelled" ? "red"
                    : profitSummaryStatus === "submitted" ? "blue"
                    : "yellow"
                  }
                >
                  {profitSummaryStatus ? profitSummaryStatus.charAt(0).toUpperCase() + profitSummaryStatus.slice(1) : ""}
                </Badge>
                <Text fontSize="xs" color="gray.600">
                  {t.master.last_update_by} <b>{lastUpdatedBy || "System"}</b> • {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                </Text>
              </Flex>
            </Card.Body>
          </Card.Root>
        )}

        {/* Header Information */}
        <Card.Root mb={6}>
          <Card.Header>
            <Heading size="md">{t.sales_profit_summary.header_information}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Field.Root invalid={!!errors.sales_profit_no} required>
                <Field.Label>{t.sales_profit_summary.reference_no}<Field.RequiredIndicator /></Field.Label>
                <Input
                  placeholder={t.sales_profit_summary.reference_no_placeholder}
                  value={referenceNo}
                  readOnly={mode === "view"}
                  onChange={(e) => { setReferenceNo(e.target.value); setErrors((p) => ({ ...p, sales_profit_no: "" })); }}
                />
                {errors.sales_profit_no && <Field.ErrorText>{errors.sales_profit_no}</Field.ErrorText>}
              </Field.Root>
              <Field.Root invalid={!!errors.sales_order_id} required>
                <Field.Label>{t.sales_profit_summary.job_order_booking}<Field.RequiredIndicator /></Field.Label>
                <Input
                  placeholder={t.sales_profit_summary.job_order_booking_placeholder}
                  value={jobOrderNo}
                  readOnly
                  cursor={mode === "view" ? "default" : "pointer"}
                  onClick={() => mode !== "view" && setSalesOrderModalOpen(true)}
                />
                {errors.sales_order_id && <Field.ErrorText>{errors.sales_order_id}</Field.ErrorText>}
              </Field.Root>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, lg: isIDR ? 2 : 3 }} gap={5} mt={4}>
              <Field.Root invalid={!!errors.customer_id} required>
                <Field.Label>{t.sales_profit_summary.customer}<Field.RequiredIndicator /></Field.Label>
                <Input
                  placeholder={t.sales_profit_summary.customer_placeholder}
                  value={customer}
                  readOnly
                  cursor={mode === "view" ? "default" : "pointer"}
                  onClick={() => mode !== "view" && setCustomerModalOpen(true)}
                />
                {errors.customer_id && <Field.ErrorText>{errors.customer_id}</Field.ErrorText>}
              </Field.Root>
              <Field.Root invalid={!!errors.currency_id} required>
                <Field.Label>{t.sales_profit_summary.currency}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  disabled={mode === "view"}
                  w="100%"
                  collection={currencyCollection}
                  value={currencySelected ? [currencySelected] : []}
                  onValueChange={(details) => { setCurrencySelected(details.value[0]); setErrors((p) => ({ ...p, currency_id: "" })); }}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_profit_summary.currency_placeholder} />
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
                {errors.currency_id && <Field.ErrorText>{errors.currency_id}</Field.ErrorText>}
              </Field.Root>
              {!isIDR && (
                <Field.Root>
                  <Field.Label>{t.sales_profit_summary.exchange_rate}</Field.Label>
                  <Input
                    value={exchangeRateInput}
                    readOnly={isReadOnly}
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
                {!isReadOnly && <Text color="red.500" fontSize="sm">*</Text>}
                {errors.items && <Text color="red.500" fontSize="sm">{errors.items}</Text>}
              </Flex>
              {!isReadOnly && (
                <Button size="sm" bg="#E77A1F" color="white" onClick={() => { addItem(); setErrors((p) => ({ ...p, items: "" })); }}>
                  {t.sales_profit_summary.add_item}
                </Button>
              )}
            </Flex>
          </Card.Header>
          <Card.Body>
            <Box overflowX="auto">
              {items.map((item) => (
                <SimpleGrid templateColumns="350px 150px 180px 180px 180px 100px" key={item.id} gap={5} mb={3}>
                  <Field.Root>
                    <Field.Label>{t.sales_profit_summary.product_services}</Field.Label>
                    {isReadOnly ? (
                      <Input value={item.itemDisplayName || item.itemName} readOnly />
                    ) : (
                      <Combobox.Root
                        collection={itemCollection}
                        value={item.itemName ? [item.itemName] : []}
                        onValueChange={(details) => {
                          const selectedId = details.value?.[0] ?? "";
                          const selectedItem = itemCollections.find((i) => i.item_id === selectedId);
                          setItems((prev) => prev.map((i) => i.id === item.id ? {
                            ...i,
                            itemName: selectedId,
                            itemDisplayName: selectedItem ? `${selectedItem.item_code} - ${selectedItem.item_name}` : selectedId,
                          } : i));
                        }}
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
                    )}
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_profit_summary.qty}</Field.Label>
                    <Input
                      type="number"
                      placeholder={t.sales_profit_summary.qty}
                      value={item.qty === 0 ? "" : item.qty}
                      readOnly={isReadOnly}
                      onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_profit_summary.selling_price}</Field.Label>
                    <Input
                      placeholder={t.sales_profit_summary.selling_price}
                      value={item.sellingPriceInput}
                      readOnly={isReadOnly}
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
                      readOnly={isReadOnly}
                      onChange={(e) => updateFormattedItem(item.id, "landedCost", e.target.value)}
                      onBlur={() => blurFormattedItem(item.id, "landedCost")}
                      onFocus={() => focusFormattedItem(item.id, "landedCost")}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_profit_summary.profit}</Field.Label>
                    <Text>
                      {(item.qty * (item.sellingPrice - item.landedCost)).toLocaleString()}
                      {" "}({item.sellingPrice > 0 ? (((item.sellingPrice - item.landedCost) / item.sellingPrice) * 100).toFixed(2) : 0}%)
                    </Text>
                  </Field.Root>
                  {!isReadOnly && (
                    <Flex align="flex-end">
                      <Button color="red" variant="ghost" onClick={() => removeItem(item.id)}>{t.sales_profit_summary.delete}</Button>
                    </Flex>
                  )}
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

        {/* Create mode actions */}
        {mode === "create" && (
          <Flex justify="flex-end" mt={8} gap={3}>
            <Button variant="outline">{t.sales_profit_summary.cancel}</Button>
            <Button bg="#E77A1F" color="white" cursor="pointer" onClick={handleSubmit}>{t.sales_profit_summary.save}</Button>
          </Flex>
        )}

        {/* Draft or Cancelled: Save + Submit */}
        {(profitSummaryStatus === "draft" || profitSummaryStatus === "cancelled") && (
          <Flex justify="flex-end" gap={3} mt={5}>
            <Button variant="outline" onClick={handleUpdate}>{t.master.save}</Button>
            <Button bg="#E77A1F" color="white" onClick={handleSubmitProfit}>{t.master.submit}</Button>
          </Flex>
        )}

        {/* Submitted: Export PDF + Reject + Approve */}
        {profitSummaryStatus === "submitted" && (
          <Flex gap={3} justifyContent="space-between" mt={5}>
            <Button variant="outline">{t.master.export_pdf}</Button>
            <Flex gap={6}>
              <Button color="red" borderColor="red" variant="outline" onClick={() => setIsRejectDialogOpen(true)}>{t.master.reject}</Button>
              <Button backgroundColor="green" onClick={handleApprove}>{t.master.approve}</Button>
            </Flex>
          </Flex>
        )}

        {/* History Log */}
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
                          { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }
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
