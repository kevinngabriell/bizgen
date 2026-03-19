"use client";

import {Box, Button, Card, Separator, Flex, Field, Grid, GridItem, HStack, IconButton, Input, Select, Stack, Text, Textarea, Heading, SimpleGrid, NumberInput, createListCollection, Portal} from "@chakra-ui/react";
import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { FaTrash } from "react-icons/fa";
import Loading from "@/components/loading";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { useRouter } from "next/navigation";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { GetCustomerData } from "@/lib/master/customer";
import CustomerLookup from "@/components/lookup/CustomerLookup";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
};

export default function CreateInvoicePage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //router authentication
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //currency option
  const [currencySelected, setSelected] = useState<string>();
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((cur) => ({
      label: `${cur.currency_name} (${cur.currency_symbol})`,
      value: cur.currency_id,
    })),
  });

  //to open customer popup
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
    
  useEffect(() => {
    init();

    const fetchCurrency = async () => {
      try {
        setLoading(true);
        const currencyRes = await getAllCurrency(1, 1000);
        setCurrencyOptions(currencyRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setCurrencyOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();

  }, []);

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
    
  const [form, setForm] = useState({
    invoiceNo: "",
    invoiceDate: dayjs().format("YYYY-MM-DD"),
    customer: "",
    jobRef: "",
    salesOrderNo: "",
    deliveryOrderNo: "",
    currency: "IDR",
    rate: 1,
    dueDate: "",
    notes: "",
  });

  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, taxPercent: 0 },
  ]);

  const [taxPercent, setTaxPercent] = useState(0);

  const subTotal = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0),
        0
      ),
    [items]
  );

  const taxAmount = useMemo(
    () => items.reduce((sum, it) => {
      const base = (it.quantity || 0) * (it.unitPrice || 0);
      return sum + (base * (it.taxPercent || 0)) / 100;
    }, 0),
    [items]
  );

  const grandTotal = useMemo(() => subTotal + taxAmount, [subTotal, taxAmount]);

  const handleChange =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
    };

  const handleNumChange =
    (key: keyof typeof form) => (_: string, v: number) => {
      setForm((p) => ({ ...p, [key]: isNaN(v) ? 0 : v }));
    };

  const updateItem = (id: string, patch: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  };

  const addItem = () => {
    setItems((p) => [
      ...p,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, taxPercent: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((p) => (p.length === 1 ? p : p.filter((it) => it.id !== id)));
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      items,
      taxPercent,
      subTotal,
      taxAmount,
      grandTotal,
    };

    // TODO: replace with API call
    console.log("Create Invoice Payload", payload);
  };

  const handleChooseCustomer = (customer: GetCustomerData) => {
    // setForm(prev => ({
    //   ...prev,
    //   customerName: customer.customer_name,
    //   contactPerson: customer.customer_pic_name,
    //   customerPhone: customer.customer_pic_contact
    // }));
    
    setCustomerModalOpen(false);
  };
  
  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Flex flexDir={"column"}>
              <Heading>{t.sales_invoice.title_create}</Heading>
              <Text fontSize={"sm"} color="gray.500">{t.sales_invoice.description}</Text>
            </Flex>

            <Flex gap={3}>
              <Button variant="outline">{t.sales_invoice.preview_pdf}</Button>
              <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleSubmit}>{t.sales_invoice.save_invoice}</Button>
            </Flex>
          </Flex>
        </Card.Header>

        <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
          
        <Card.Body>
          <SimpleGrid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
            <Field.Root>
              <Field.Label>{t.sales_invoice.invoice_number}</Field.Label>
              <Input placeholder={t.sales_invoice.invoice_number_placeholder} value={form.invoiceNo} onChange={handleChange("invoiceNo")}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_invoice.invoice_date}</Field.Label>
              <Input type="date" value={form.invoiceDate} onChange={handleChange("invoiceDate")}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_invoice.due_date}</Field.Label>
              <Input type="date" value={form.dueDate} onChange={handleChange("dueDate")}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_invoice.customer}</Field.Label>
              <Input placeholder={t.sales_invoice.customer_placeholder} readOnly cursor="pointer" onClick={() => setCustomerModalOpen(true)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_invoice.job_reference}</Field.Label>
              <Input placeholder={t.sales_invoice.job_reference_placeholder} value={form.jobRef} onChange={handleChange("jobRef")}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Sales Order No</Field.Label>
              <Input placeholder="Enter SO Number" value={form.salesOrderNo} onChange={handleChange("salesOrderNo")}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Delivery Order No</Field.Label>
              <Input placeholder="Enter DO Number" value={form.deliveryOrderNo} onChange={handleChange("deliveryOrderNo")}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_invoice.currency}</Field.Label>
                    <Select.Root collection={currencyCollection} value={currencySelected ? [currencySelected] : []} onValueChange={(details) => setSelected(details.value[0])} size="sm" width="100%">
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
                            {currencyCollection.items.map((currency) => (
                              <Select.Item item={currency} key={currency.value}>{currency.label}<Select.ItemIndicator /></Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_invoice.exchange_rate}</Field.Label>
              <Input type="number" placeholder={t.sales_invoice.exchange_rate_helper}/>

            </Field.Root>
          </SimpleGrid>

          <Flex justify="space-between" align="center" mb={3} mt={7}>
            <Text fontWeight="semibold">{t.sales_invoice.line_items}</Text>
            <Button size="sm" variant="outline" onClick={addItem}>{t.sales_invoice.add_item}</Button>
          </Flex>

          {items.map((it) => {
            const base = (it.quantity || 0) * (it.unitPrice || 0);
            const lineTax = (base * (it.taxPercent || 0)) / 100;
            const amount = base + lineTax;

            return(
              <Card.Root key={it.id} variant="subtle">
                <Card.Body>
                  <SimpleGrid templateColumns={{base: "1fr", md: "3fr 1fr 1fr 1fr 1fr auto"}} gap={4} alignItems="end">
                    <Field.Root>
                      <Field.Label>{t.sales_invoice.description_label}</Field.Label>
                      <Input placeholder={t.sales_invoice.description_placeholder} value={it.description} onChange={(e) => updateItem(it.id, {description: e.target.value,})}/>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_invoice.quantity}</Field.Label>
                      <NumberInput.Root value={String(it.quantity)} onValueChange={(d) => updateItem(it.id, { quantity: Number(d.value) })}>
                        <NumberInput.Control/>
                        <NumberInput.Input/>
                      </NumberInput.Root>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_invoice.unit_price}</Field.Label>
                      <NumberInput.Root value={String(it.unitPrice)} onValueChange={(d) => updateItem(it.id, { unitPrice: Number(d.value) })}>
                        <NumberInput.Control/>
                        <NumberInput.Input/>
                      </NumberInput.Root>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Tax (%)</Field.Label>
                      <NumberInput.Root value={String(it.taxPercent)} onValueChange={(d) => updateItem(it.id, { taxPercent: Number(d.value) })}>
                        <NumberInput.Control/>
                        <NumberInput.Input/>
                      </NumberInput.Root>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_invoice.amount}</Field.Label>
                      <Input value={amount.toLocaleString()}/>
                    </Field.Root>
                    <IconButton aria-label="Remove" variant="ghost" color="red" onClick={() => removeItem(it.id)}>
                      <FaTrash/>
                    </IconButton>
                  </SimpleGrid>
                </Card.Body>
              </Card.Root>
            );
          })}

          <SimpleGrid templateColumns={{ base: "1fr", md: "1fr 300px" }} gap={6} alignItems="start" mt={7}>
            <Field.Root>
              <Field.Label>{t.sales_invoice.notes}</Field.Label>
              <Textarea placeholder={t.sales_invoice.notes_placeholder} value={form.notes}/>
            </Field.Root>

            <Card.Root>
              <Card.Body>
                <Flex justify="space-between">
                  <Text color="gray.600" fontSize={"sm"}>{t.sales_invoice.subtotal}</Text>
                  <Text fontWeight="semibold" fontSize={"sm"}>{subTotal.toLocaleString()}</Text>
                </Flex>

                <Field.Root mt={3}>
                  <Field.Label fontSize={"sm"}>{t.sales_invoice.tax_percent}</Field.Label>
                  <NumberInput.Root>
                    <NumberInput.Control/>
                    <NumberInput.Input/>
                  </NumberInput.Root>
                </Field.Root>

                <Flex justify="space-between" mt={3}>
                  <Text color="gray.600" fontSize={"sm"}>{t.sales_invoice.tax_amount}</Text>
                  <Text fontWeight="semibold" fontSize={"sm"}>{taxAmount.toLocaleString()}</Text>
                </Flex>

                <Separator mt={3}/>

                <Flex justify="space-between" mt={3}>
                  <Text fontWeight="bold">{t.sales_invoice.grand_total}</Text>
                  <Text fontWeight="bold">{grandTotal.toLocaleString()} {form.currency}</Text>
                </Flex>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>    
  );
}