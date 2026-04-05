"use client";

import Loading from "@/components/loading";
import CustomerLookup from "@/components/lookup/CustomerLookup";
import DeliveryOrderLookup from "@/components/lookup/DeliveryOrderLookup";
import SalesOrderLookup from "@/components/lookup/SalesOrderLookup";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { AlertMessage } from "@/components/ui/alert";
import RejectDialog from "@/components/dialog/RejectDialog";
import { SALES_APPROVAL_ROLES, SALES_CREATE_ROLES, DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { GetCustomerData } from "@/lib/master/customer";
import { getAllItem, GetItemData } from "@/lib/master/item";
import {
  createSalesInvoice,
  generateSalesInvoiceNumber,
  getDetailSalesInvoice,
  updateSalesInvoice,
  processSalesInvoiceAction,
  GetDetailInvoiceHistory,
} from "@/lib/sales/invoice";
import { GetSalesDeliveryItemData } from "@/lib/sales/delivery-order";
import { GetSalesOrderItemData } from "@/lib/sales/sales-order";
import {
  Badge, Box, Button, Card, Combobox, createListCollection, Field, Flex,
  Heading, IconButton, Input, Portal, Select, Separator, SimpleGrid, Text,
  Textarea, useFilter, useListCollection,
} from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { FaTrash } from "react-icons/fa";

type InvoiceMode = "create" | "view";

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={<Loading />}>
      <InvoiceContent />
    </Suspense>
  );
}

function InvoiceContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const canApprove = SALES_APPROVAL_ROLES.has(auth?.app_role_id ?? "");
  const canCreate = SALES_CREATE_ROLES.has(auth?.app_role_id ?? "");

  const searchParams = useSearchParams();
  const invoiceID = searchParams.get("invoice_id");

  const [invoiceStatus, setInvoiceStatus] = useState<string>();
  const [invoiceDetailId, setInvoiceDetailId] = useState<string>("");
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();

  const [mode, setMode] = useState<InvoiceMode>("create");
  // Only lock when status is explicitly submitted or confirmed
  const isReadOnly = mode === "view" && (invoiceStatus === "submitted" || invoiceStatus === "confirmed");

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const [historyData, setHistoryData] = useState<GetDetailInvoiceHistory[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [salesOrderModalOpen, setSalesOrderModalOpen] = useState(false);
  const [deliveryOrderModalOpen, setDeliveryOrderModalOpen] = useState(false);

  const [customer, setCustomer] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [salesOrderNo, setSalesOrderNo] = useState("");
  const [salesOrderId, setSalesOrderId] = useState("");
  const [deliveryOrderNo, setDeliveryOrderNo] = useState("");
  const [deliveryOrderId, setDeliveryOrderId] = useState("");
  const [exchangeRate, setExchangeRate] = useState(15000);
  const [exchangeRateInput, setExchangeRateInput] = useState("15,000");
  const [notes, setNotes] = useState("");

  const selectedCurrencyData = currencyOptions.find((c) => c.currency_id === currencySelected);
  const currencySymbol = selectedCurrencyData?.currency_symbol ?? "USD";
  const isIDR = selectedCurrencyData?.currency_symbol === "IDR" || selectedCurrencyData?.currency_code === "IDR";

  const [items, setItems] = useState([
    { id: crypto.randomUUID(), invoiceItemId: "", itemId: "", itemDisplayName: "", quantity: 1, unitPrice: 0, unitPriceInput: "", taxPercent: 0 },
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
    const loadAll = async () => {
      try {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if (!valid) return;
        const info = getAuthInfo();
        setAuth(info);
        setLang(info?.language === "id" ? "id" : "en");

        const [currencyRes, itemRes] = await Promise.all([
          getAllCurrency(1, 1000),
          getAllItem(1, 10000),
        ]);

        const currencyData = currencyRes?.data ?? [];
        const itemData = itemRes?.data ?? [];

        setCurrencyOptions(currencyData);
        setItemCollection(itemData);
        setItemCollections(itemData);

        if (invoiceID) {
          setMode("view");
          const res = await getDetailSalesInvoice(invoiceID);
          const h = res.header as any;

          setInvoiceDetailId(h.invoice_id ?? "");
          setInvoiceNo(h.invoice_number ?? "");
          setInvoiceDate(h.invoice_date ?? "");
          setDueDate(h.due_date ?? "");
          setCustomer(h.customer_name ?? "");
          setSalesOrderNo(h.sales_order_no ?? "");
          setDeliveryOrderNo(h.delivery_order_no ?? h.do_number ?? "");
          setNotes(h.notes ?? "");
          setInvoiceStatus(h.status?.toLowerCase() ?? "");
          setLastUpdatedBy(h.updated_by ?? h.created_by);
          setLastUpdatedAt(h.updated_at ?? h.created_at);

          const rate = Number(h.exchange_rate_to_idr) || 15000;
          setExchangeRate(rate);
          setExchangeRateInput(rate.toLocaleString());

          const matchedCurrency = currencyData.find(
            (c) => c.currency_code === h.currency_code || c.currency_symbol === h.currency_code
          );
          if (matchedCurrency) setCurrencySelected(matchedCurrency.currency_id);

          setItems(
            res.items.map((item) => {
              const matched = itemData.find((i) => i.item_name === item.item_name);
              return {
                id: crypto.randomUUID(),
                invoiceItemId: item.invoice_item_id ?? "",
                itemId: matched?.item_id ?? "",
                itemDisplayName: item.item_name,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                unitPriceInput: item.unit_price.toLocaleString(),
                taxPercent: (item as any).tax_percent ?? (item as any).tax_rate ?? 0,
              };
            })
          );

          setHistoryData(res.history);
        } else {
          const res = await generateSalesInvoiceNumber();
          setInvoiceNo(res.number);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [invoiceID]);

  const clearAmountErrors = () =>
    setErrors((prev) => { const e = { ...prev }; delete e.subtotal_amount; delete e.grand_total; delete e.items; return e; });

  const addItem = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), invoiceItemId: "", itemId: "", itemDisplayName: "", quantity: 1, unitPrice: 0, unitPriceInput: "", taxPercent: 0 }]);
    clearAmountErrors();
  };

  const removeItem = (id: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));

  const updateItem = (id: string, key: string, value: string | number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)));
    clearAmountErrors();
  };

  const updateUnitPrice = (id: string, raw: string) => {
    const numeric = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, unitPrice: numeric, unitPriceInput: raw } : i));
    clearAmountErrors();
  };

  const blurUnitPrice = (id: string) =>
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, unitPriceInput: i.unitPrice === 0 ? "" : i.unitPrice.toLocaleString() } : i));

  const focusUnitPrice = (id: string) =>
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, unitPriceInput: i.unitPrice === 0 ? "" : String(i.unitPrice) } : i));

  const subTotal = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0), [items]);
  const taxAmount = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unitPrice * (i.taxPercent / 100), 0), [items]);
  const grandTotal = useMemo(() => subTotal + taxAmount, [subTotal, taxAmount]);
  const grandTotalIdr = isIDR ? grandTotal : grandTotal * exchangeRate;
  const overallTaxPercent = subTotal > 0 ? ((taxAmount / subTotal) * 100).toFixed(2) : "0";

  const handleChooseCustomer = (selectedCustomer: GetCustomerData) => {
    setCustomer(selectedCustomer.customer_name);
    setCustomerId(selectedCustomer.customer_id);
    setErrors((prev) => { const e = { ...prev }; delete e.customer_id; return e; });
    setCustomerModalOpen(false);
  };

  const handleChooseSalesOrder = (selectedSO: GetSalesOrderItemData) => {
    setSalesOrderNo(selectedSO.sales_order_no);
    setSalesOrderId(selectedSO.sales_order_id);
    setErrors((prev) => { const e = { ...prev }; delete e.sales_order_id; return e; });
    setSalesOrderModalOpen(false);
  };

  const handleChooseDeliveryOrder = (selectedDO: GetSalesDeliveryItemData) => {
    setDeliveryOrderNo(selectedDO.do_number);
    setDeliveryOrderId(selectedDO.delivery_order_id);
    setErrors((prev) => { const e = { ...prev }; delete e.delivery_order_id; return e; });
    setDeliveryOrderModalOpen(false);
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!invoiceNo.trim()) newErrors.invoice_number = "Required";
    if (!customerId) newErrors.customer_id = "Required";
    if (!currencySelected) newErrors.currency_id = "Required";
    if (!salesOrderId) newErrors.sales_order_id = "Required";
    if (!deliveryOrderId) newErrors.delivery_order_id = "Required";
    if (!invoiceDate) newErrors.invoice_date = "Required";
    if (subTotal <= 0) newErrors.subtotal_amount = "Subtotal must be greater than 0";
    if (grandTotal <= 0) newErrors.grand_total = "Grand total must be greater than 0";
    if (items.length === 0) newErrors.items = "At least one item is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      await createSalesInvoice({
        invoice_number: invoiceNo,
        customer_id: customerId,
        currency_id: currencySelected!,
        sales_order_id: salesOrderId,
        delivery_order_id: deliveryOrderId,
        invoice_date: invoiceDate,
        due_date: dueDate,
        exchange_rate_to_idr: String(exchangeRate),
        subtotal_amount: String(subTotal),
        tax_percent: overallTaxPercent,
        tax_amount: String(taxAmount),
        grand_total: String(grandTotal),
        grand_total_idr: String(grandTotalIdr),
        items: items.map((i) => {
          const itemTax = i.quantity * i.unitPrice * (i.taxPercent / 100);
          const itemTotal = i.quantity * i.unitPrice + itemTax;
          return {
            items_id: i.itemId,
            quantity: String(i.quantity),
            unit_price: String(i.unitPrice),
            tax: String(itemTax),
            total: String(itemTotal),
          };
        }),
      });

      showSuccess(t.sales_invoice.success_create);

      const newNumber = await generateSalesInvoiceNumber();
      setInvoiceNo(newNumber.number);
      setCustomer(""); setCustomerId("");
      setInvoiceDate(""); setDueDate("");
      setSalesOrderNo(""); setSalesOrderId("");
      setDeliveryOrderNo(""); setDeliveryOrderId("");
      setCurrencySelected(undefined);
      setExchangeRate(15000); setExchangeRateInput("15,000");
      setNotes("");
      setItems([{ id: crypto.randomUUID(), invoiceItemId: "", itemId: "", itemDisplayName: "", quantity: 1, unitPrice: 0, unitPriceInput: "", taxPercent: 0 }]);
    } catch (err: any) {
      showError(err.message || t.sales_invoice.success_create);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!invoiceDetailId) throw new Error("Invoice ID not found");
      setLoading(true);

      await updateSalesInvoice({
        invoice_id: invoiceDetailId,
        invoice_date: invoiceDate,
        due_date: dueDate,
        exchange_rate_to_idr: String(exchangeRate),
        subtotal_amount: String(subTotal),
        tax_amount: String(taxAmount),
        total_amount: String(grandTotal),
        notes: notes,
      });

      showSuccess(t.sales_invoice.success_update ?? "Invoice updated successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to update invoice.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInvoice = async () => {
    try {
      if (!invoiceDetailId) throw new Error("Invoice ID not found");
      setLoading(true);

      await processSalesInvoiceAction({ invoice_id: invoiceDetailId, action: "submit" });

      setInvoiceStatus("submitted");
      showSuccess("Invoice submitted successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to submit invoice.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      if (!invoiceDetailId) throw new Error("Invoice ID not found");
      setLoading(true);

      await processSalesInvoiceAction({ invoice_id: invoiceDetailId, action: "approve" });

      setInvoiceStatus("confirmed");
      showSuccess("Invoice approved successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to approve invoice.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      if (!invoiceDetailId) throw new Error("Invoice ID not found");
      setRejectLoading(true);

      await processSalesInvoiceAction({ invoice_id: invoiceDetailId, action: "reject", notes: reason });

      setIsRejectDialogOpen(false);
      setInvoiceStatus("cancelled");
      showSuccess("Invoice rejected successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to reject invoice.");
    } finally {
      setRejectLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>

        <Heading size="lg" mb={4}>
          {mode === "create" ? t.sales_invoice.title_create : t.sales_invoice.title_view}
        </Heading>

        <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
        <SalesOrderLookup isOpen={salesOrderModalOpen} onClose={() => setSalesOrderModalOpen(false)} onChoose={handleChooseSalesOrder} />
        <DeliveryOrderLookup isOpen={deliveryOrderModalOpen} onClose={() => setDeliveryOrderModalOpen(false)} onChoose={handleChooseDeliveryOrder} />

        {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

        {/* Status Badge */}
        {mode === "view" && (
          <Card.Root mb={4}>
            <Card.Body>
              <Flex justifyContent="space-between">
                <Badge
                  variant="solid"
                  colorPalette={
                    invoiceStatus === "confirmed" ? "green"
                    : invoiceStatus === "cancelled" ? "red"
                    : invoiceStatus === "submitted" ? "blue"
                    : "yellow"
                  }
                >
                  {invoiceStatus ? invoiceStatus.charAt(0).toUpperCase() + invoiceStatus.slice(1) : ""}
                </Badge>
                <Text fontSize="xs" color="gray.600">
                  {t.master.last_update_by} <b>{lastUpdatedBy || "System"}</b> • {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                </Text>
              </Flex>
            </Card.Body>
          </Card.Root>
        )}

        {/* Invoice Information */}
        <Card.Root mb={6}>
          <Card.Header>
            <Heading size="md">{t.sales_invoice.invoice_information}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root required invalid={!!errors.invoice_number}>
                <Field.Label>{t.sales_invoice.invoice_number}<Field.RequiredIndicator /></Field.Label>
                <Input
                  placeholder={t.sales_invoice.invoice_number_placeholder}
                  value={invoiceNo}
                  readOnly={mode === "view"}
                  onChange={(e) => { setInvoiceNo(e.target.value); setErrors((prev) => { const e = { ...prev }; delete e.invoice_number; return e; }); }}
                />
                <Field.ErrorText>{errors.invoice_number}</Field.ErrorText>
              </Field.Root>
              <Field.Root required invalid={!!errors.invoice_date}>
                <Field.Label>{t.sales_invoice.invoice_date}<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="date"
                  value={invoiceDate}
                  readOnly={isReadOnly}
                  onChange={(e) => { setInvoiceDate(e.target.value); setErrors((prev) => { const e = { ...prev }; delete e.invoice_date; return e; }); }}
                />
                <Field.ErrorText>{errors.invoice_date}</Field.ErrorText>
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_invoice.due_date}</Field.Label>
                <Input
                  type="date"
                  value={dueDate}
                  readOnly={isReadOnly}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Field.Root>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mt={4}>
              <Field.Root required invalid={!!errors.customer_id}>
                <Field.Label>{t.sales_invoice.customer}<Field.RequiredIndicator /></Field.Label>
                <Input
                  placeholder={t.sales_invoice.customer_placeholder}
                  value={customer}
                  readOnly
                  cursor={mode === "view" ? "default" : "pointer"}
                  onClick={() => mode !== "view" && setCustomerModalOpen(true)}
                />
                <Field.ErrorText>{errors.customer_id}</Field.ErrorText>
              </Field.Root>
              <Field.Root required invalid={!!errors.sales_order_id}>
                <Field.Label>{t.sales_invoice.sales_order_no}<Field.RequiredIndicator /></Field.Label>
                <Input
                  placeholder={t.sales_invoice.sales_order_no_placeholder}
                  value={salesOrderNo}
                  readOnly
                  cursor={mode === "view" ? "default" : "pointer"}
                  onClick={() => mode !== "view" && setSalesOrderModalOpen(true)}
                />
                <Field.ErrorText>{errors.sales_order_id}</Field.ErrorText>
              </Field.Root>
              <Field.Root required invalid={!!errors.delivery_order_id}>
                <Field.Label>{t.sales_invoice.delivery_order_no}<Field.RequiredIndicator /></Field.Label>
                <Input
                  placeholder={t.sales_invoice.delivery_order_no_placeholder}
                  value={deliveryOrderNo}
                  readOnly
                  cursor={mode === "view" ? "default" : "pointer"}
                  onClick={() => mode !== "view" && setDeliveryOrderModalOpen(true)}
                />
                <Field.ErrorText>{errors.delivery_order_id}</Field.ErrorText>
              </Field.Root>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, lg: isIDR ? 1 : 2 }} gap={4} mt={4}>
              <Field.Root required invalid={!!errors.currency_id}>
                <Field.Label>{t.sales_invoice.currency}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  disabled={mode === "view"}
                  w="100%"
                  collection={currencyCollection}
                  value={currencySelected ? [currencySelected] : []}
                  onValueChange={(details) => { setCurrencySelected(details.value[0]); setErrors((prev) => { const e = { ...prev }; delete e.currency_id; return e; }); }}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_invoice.currency_placeholder} />
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
                <Field.ErrorText>{errors.currency_id}</Field.ErrorText>
              </Field.Root>
              {!isIDR && (
                <Field.Root>
                  <Field.Label>{t.sales_invoice.exchange_rate}</Field.Label>
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

        {/* Line Items */}
        <Card.Root mb={6}>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Heading size="md">{t.sales_invoice.line_items}</Heading>
                {errors.items && <Text color="red.500" fontSize="sm">{errors.items}</Text>}
              </Flex>
              {!isReadOnly && (
                <Button size="sm" bg="#E77A1F" color="white" onClick={addItem}>{t.sales_invoice.add_item}</Button>
              )}
            </Flex>
          </Card.Header>
          <Card.Body>
            <Box overflowX="auto">
              {items.map((item) => {
                const base = item.quantity * item.unitPrice;
                const amount = base + base * (item.taxPercent / 100);
                return (
                  <SimpleGrid templateColumns="2fr 100px 180px 100px 160px 60px" key={item.id} gap={4} mb={3}>
                    <Field.Root>
                      <Field.Label>{t.sales_invoice.description_label}</Field.Label>
                      {isReadOnly ? (
                        <Input value={item.itemDisplayName || item.itemId} readOnly />
                      ) : (
                        <Combobox.Root
                          collection={itemCollection}
                          value={item.itemId ? [item.itemId] : []}
                          onValueChange={(details) => {
                            const selectedId = details.value?.[0] ?? "";
                            const selectedItem = itemCollections.find((i) => i.item_id === selectedId);
                            setItems((prev) => prev.map((i) => i.id === item.id ? {
                              ...i,
                              itemId: selectedId,
                              itemDisplayName: selectedItem ? `${selectedItem.item_code} - ${selectedItem.item_name}` : selectedId,
                            } : i));
                            clearAmountErrors();
                          }}
                          onInputValueChange={(e) => {
                            const input = e.inputValue ?? "";
                            if (!input.trim()) { setItemCollection(itemCollections); return; }
                            setItemCollection(itemCollections.filter((i) => contains(`${i.item_code} - ${i.item_name}`, input)));
                          }}
                        >
                          <Combobox.Control>
                            <Combobox.Input placeholder={t.sales_invoice.description_placeholder} onFocus={() => setItemCollection(itemCollections)} />
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
                      <Field.Label>{t.sales_invoice.quantity}</Field.Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.quantity === 0 ? "" : item.quantity}
                        readOnly={isReadOnly}
                        onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_invoice.unit_price}</Field.Label>
                      <Input
                        placeholder="0"
                        value={item.unitPriceInput}
                        readOnly={isReadOnly}
                        onChange={(e) => updateUnitPrice(item.id, e.target.value)}
                        onBlur={() => blurUnitPrice(item.id)}
                        onFocus={() => focusUnitPrice(item.id)}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_invoice.tax_percent}</Field.Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.taxPercent === 0 ? "" : item.taxPercent}
                        readOnly={isReadOnly}
                        onChange={(e) => updateItem(item.id, "taxPercent", parseFloat(e.target.value) || 0)}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_invoice.amount} ({currencySymbol})</Field.Label>
                      <Text pt={2} fontWeight="medium">
                        {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </Field.Root>
                    {!isReadOnly && (
                      <Flex align="flex-end" pb={1}>
                        <IconButton aria-label="Remove" variant="ghost" color="red" onClick={() => removeItem(item.id)}>
                          <FaTrash />
                        </IconButton>
                      </Flex>
                    )}
                  </SimpleGrid>
                );
              })}
            </Box>

            <Separator mt={4} />

            <Flex justify="flex-end" mt={4}>
              <Box w={{ base: "100%", md: "320px" }}>
                <Flex justify="space-between" mb={1}>
                  <Text color="gray.600">{t.sales_invoice.subtotal} ({currencySymbol})</Text>
                  <Text fontWeight="semibold">{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </Flex>
                {errors.subtotal_amount && <Text color="red.500" fontSize="sm" mb={1}>{errors.subtotal_amount}</Text>}
                <Flex justify="space-between" mb={2}>
                  <Text color="gray.600">{t.sales_invoice.tax_amount}</Text>
                  <Text fontWeight="semibold">{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </Flex>
                <Separator mb={2} />
                <Flex justify="space-between">
                  <Text fontWeight="bold">{t.sales_invoice.grand_total} ({currencySymbol})</Text>
                  <Text fontWeight="bold" color={errors.grand_total ? "red.500" : undefined}>
                    {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </Flex>
                {errors.grand_total && <Text color="red.500" fontSize="sm" mt={1}>{errors.grand_total}</Text>}
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* Notes */}
        <Card.Root mb={6}>
          <Card.Header>
            <Heading size="md">{t.sales_invoice.notes}</Heading>
          </Card.Header>
          <Card.Body>
            <Textarea
              placeholder={t.sales_invoice.notes_placeholder}
              value={notes}
              readOnly={isReadOnly}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </Card.Body>
        </Card.Root>

        {/* Create mode actions */}
        {mode === "create" && canCreate && (
          <Flex justify="flex-end" mt={4} gap={3}>
            <Button variant="outline">{t.sales_invoice.cancel}</Button>
            <Button bg="#E77A1F" color="white" cursor="pointer" onClick={handleSubmit}>{t.sales_invoice.save_invoice}</Button>
          </Flex>
        )}

        {/* Draft or Cancelled: Save + Submit */}
        {(invoiceStatus === "draft" || invoiceStatus === "cancelled") && (
          <Flex justify="flex-end" gap={3} mt={5}>
            <Button variant="outline" onClick={handleUpdate}>{t.master.save}</Button>
            <Button bg="#E77A1F" color="white" onClick={handleSubmitInvoice}>{t.master.submit}</Button>
          </Flex>
        )}

        {/* Submitted: Export PDF + Reject + Approve */}
        {invoiceStatus === "submitted" && (
          <Flex gap={3} justifyContent="space-between" mt={5}>
            <Button variant="outline">{t.master.export_pdf}</Button>
            <Flex gap={6}>
              {canApprove && <Button color="red" borderColor="red" variant="outline" onClick={() => setIsRejectDialogOpen(true)}>{t.master.reject}</Button>}
              {canApprove && <Button backgroundColor="green" onClick={handleApprove}>{t.master.approve}</Button>}
            </Flex>
          </Flex>
        )}

        {/* Confirmed: Export PDF only */}
        {invoiceStatus === "confirmed" && (
          <Flex justify="flex-start" mt={5}>
            <Button variant="outline">{t.master.export_pdf}</Button>
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
                    {log.note} by <b>{log.created_by}</b>
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
