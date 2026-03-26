"use client";

import Loading from "@/components/loading";
import CustomerLookup from "@/components/lookup/CustomerLookup";
import DeliveryOrderLookup from "@/components/lookup/DeliveryOrderLookup";
import SalesOrderLookup from "@/components/lookup/SalesOrderLookup";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { AlertMessage } from "@/components/ui/alert";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { GetCustomerData } from "@/lib/master/customer";
import { getAllItem, GetItemData } from "@/lib/master/item";
import { createSalesInvoice, generateSalesInvoiceNumber } from "@/lib/sales/invoice";
import { GetSalesDeliveryItemData } from "@/lib/sales/delivery-order";
import { GetSalesOrderItemData } from "@/lib/sales/sales-order";
import { Badge, Box, Button, Card, Combobox, createListCollection, Field, Flex, Heading, IconButton, Input, Portal, Select, Separator, SimpleGrid, Text, Textarea, useFilter, useListCollection } from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { FaTrash } from "react-icons/fa";

type InvoiceMode = "create" | "view" | "edit";

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

  const searchParams = useSearchParams();
  const invoiceID = searchParams.get("invoice_id");

  const [mode, setMode] = useState<InvoiceMode>("create");

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
  const [jobReference, setJobReference] = useState("");
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
    { id: crypto.randomUUID(), itemId: "", quantity: 1, unitPrice: 0, unitPriceInput: "", taxPercent: 0 },
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

    const loadGeneratedNumber = async () => {
      if (invoiceID) return;
      const res = await generateSalesInvoiceNumber();
      setInvoiceNo(res.number);
    };

    const loadAll = async () => {
      try {
        setLoading(true);
        await init();
        await loadMaster();
        await loadGeneratedNumber();
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
    setItems((prev) => [...prev, { id: crypto.randomUUID(), itemId: "", quantity: 1, unitPrice: 0, unitPriceInput: "", taxPercent: 0 }]);
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

      setShowAlert(true);
      setIsSuccess(true);
      setTitlePopup(t.master.success);
      setMessagePopup(t.sales_invoice.success_create);

      // Reset form
      const newNumber = await generateSalesInvoiceNumber();
      setInvoiceNo(newNumber.number);
      setCustomer("");
      setCustomerId("");
      setInvoiceDate("");
      setDueDate("");
      setJobReference("");
      setSalesOrderNo("");
      setSalesOrderId("");
      setDeliveryOrderNo("");
      setDeliveryOrderId("");
      setCurrencySelected(undefined);
      setExchangeRate(15000);
      setExchangeRateInput("15,000");
      setNotes("");
      setItems([{ id: crypto.randomUUID(), itemId: "", quantity: 1, unitPrice: 0, unitPriceInput: "", taxPercent: 0 }]);

      setTimeout(() => setShowAlert(false), 6000);
    } catch (err: any) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(err.message || t.sales_invoice.success_create);
      setTimeout(() => setShowAlert(false), 6000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>

      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">{t.sales_invoice.title_create}</Heading>
      </Flex>

      <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
      <SalesOrderLookup isOpen={salesOrderModalOpen} onClose={() => setSalesOrderModalOpen(false)} onChoose={handleChooseSalesOrder} />
      <DeliveryOrderLookup isOpen={deliveryOrderModalOpen} onClose={() => setDeliveryOrderModalOpen(false)} onChoose={handleChooseDeliveryOrder} />

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

      {/* Invoice Information */}
      <Card.Root mb={6}>
        <Card.Header>
          <Heading size="md">{t.sales_invoice.invoice_information}</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Field.Root required invalid={!!errors.invoice_number}>
              <Field.Label>{t.sales_invoice.invoice_number}<Field.RequiredIndicator/></Field.Label>
              <Input placeholder={t.sales_invoice.invoice_number_placeholder} value={invoiceNo} onChange={(e) => { setInvoiceNo(e.target.value); setErrors((prev) => { const e = { ...prev }; delete e.invoice_number; return e; }); }} />
              <Field.ErrorText>{errors.invoice_number}</Field.ErrorText>
            </Field.Root>
            <Field.Root required invalid={!!errors.invoice_date}>
              <Field.Label>{t.sales_invoice.invoice_date}<Field.RequiredIndicator/></Field.Label>
              <Input type="date" value={invoiceDate} onChange={(e) => { setInvoiceDate(e.target.value); setErrors((prev) => { const e = { ...prev }; delete e.invoice_date; return e; }); }} />
              <Field.ErrorText>{errors.invoice_date}</Field.ErrorText>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_invoice.due_date}</Field.Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field.Root>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mt={4}>
            <Field.Root required invalid={!!errors.customer_id}>
              <Field.Label>{t.sales_invoice.customer}<Field.RequiredIndicator/></Field.Label>
              <Input placeholder={t.sales_invoice.customer_placeholder} value={customer} readOnly cursor="pointer" onClick={() => setCustomerModalOpen(true)} />
              <Field.ErrorText>{errors.customer_id}</Field.ErrorText>
            </Field.Root>
            <Field.Root required invalid={!!errors.sales_order_id}>
              <Field.Label>{t.sales_invoice.sales_order_no}<Field.RequiredIndicator/></Field.Label>
              <Input placeholder={t.sales_invoice.sales_order_no_placeholder} value={salesOrderNo} readOnly cursor="pointer" onClick={() => setSalesOrderModalOpen(true)} />
              <Field.ErrorText>{errors.sales_order_id}</Field.ErrorText>
            </Field.Root>
            <Field.Root required invalid={!!errors.delivery_order_id}>
              <Field.Label>{t.sales_invoice.delivery_order_no}<Field.RequiredIndicator/></Field.Label>
              <Input placeholder={t.sales_invoice.delivery_order_no_placeholder} value={deliveryOrderNo} readOnly cursor="pointer" onClick={() => setDeliveryOrderModalOpen(true)} />
              <Field.ErrorText>{errors.delivery_order_id}</Field.ErrorText>
            </Field.Root>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: isIDR ? 1 : 2 }} gap={4} mt={4}>
            <Field.Root required invalid={!!errors.currency_id}>
              <Field.Label>{t.sales_invoice.currency}<Field.RequiredIndicator/></Field.Label>
              <Select.Root w="100%" collection={currencyCollection} value={currencySelected ? [currencySelected] : []} onValueChange={(details) => { setCurrencySelected(details.value[0]); setErrors((prev) => { const e = { ...prev }; delete e.currency_id; return e; }); }}>
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.sales_invoice.currency_placeholder} />
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
              <Field.ErrorText>{errors.currency_id}</Field.ErrorText>
            </Field.Root>
            {!isIDR && (
              <Field.Root>
                <Field.Label>{t.sales_invoice.exchange_rate}</Field.Label>
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

      {/* Line Items */}
      <Card.Root mb={6}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Flex align="center" gap={2}>
              <Heading size="md">{t.sales_invoice.line_items}</Heading>
              {errors.items && <Text color="red.500" fontSize="sm">{errors.items}</Text>}
            </Flex>
            <Button size="sm" bg="#E77A1F" color="white" onClick={addItem}>{t.sales_invoice.add_item}</Button>
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
                    <Combobox.Root
                      collection={itemCollection}
                      onValueChange={(details) => updateItem(item.id, "itemId", details.value?.[0] ?? "")}
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
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_invoice.quantity}</Field.Label>
                    <Input type="number" placeholder="0" value={item.quantity === 0 ? "" : item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)} />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_invoice.unit_price}</Field.Label>
                    <Input
                      placeholder="0"
                      value={item.unitPriceInput}
                      onChange={(e) => updateUnitPrice(item.id, e.target.value)}
                      onBlur={() => blurUnitPrice(item.id)}
                      onFocus={() => focusUnitPrice(item.id)}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_invoice.tax_percent}</Field.Label>
                    <Input type="number" placeholder="0" value={item.taxPercent === 0 ? "" : item.taxPercent} onChange={(e) => updateItem(item.id, "taxPercent", parseFloat(e.target.value) || 0)} />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_invoice.amount} ({currencySymbol})</Field.Label>
                    <Text pt={2} fontWeight="medium">{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  </Field.Root>
                  <Flex align="flex-end" pb={1}>
                    <IconButton aria-label="Remove" variant="ghost" color="red" onClick={() => removeItem(item.id)}>
                      <FaTrash />
                    </IconButton>
                  </Flex>
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
                <Text fontWeight="bold" color={errors.grand_total ? "red.500" : undefined}>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
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
          <Textarea placeholder={t.sales_invoice.notes_placeholder} value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
        </Card.Body>
      </Card.Root>

      {/* Actions */}
      <Flex justify="flex-end" mt={4} gap={3}>
        <Button variant="outline">{t.sales_invoice.cancel}</Button>
        <Button bg="#E77A1F" color="white" cursor="pointer" onClick={handleSubmit}>{t.sales_invoice.save_invoice}</Button>
      </Flex>

    </SidebarWithHeader>
  );
}
