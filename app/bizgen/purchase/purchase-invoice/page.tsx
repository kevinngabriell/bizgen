"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { getAllSupplier, GetSupplierData } from "@/lib/master/supplier";
import { Box, Button, Card, Separator, Flex, Field, Heading, IconButton, Input, NumberInput, SimpleGrid, Table, Text, Textarea, createListCollection, Select, Portal } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

type InvoiceItem = {
  id: string;
  description: string;
  qty: number;
  uom: string;
  unitPrice: number;
  taxRate: number;
};

export default function CreatePurchaseInvoicePage() {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [poRef, setPoRef] = useState("");
  const [notes, setNotes] = useState("");

  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [supplierSelected, setSupplierSelected] = useState<string>();
  const [supplierOptions, setSupplierOptions] = useState<GetSupplierData[]>([]);

  const supplierCollection = createListCollection({
    items: supplierOptions.map((supplier) => ({
        label: `${supplier.supplier_name}`,
        value: supplier.supplier_id,
      })),
  });

  const [currencySelected, setCurrencySelected] = useState<string>();
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((currency) => ({
        label: `${currency.currency_name} (${currency.currency_symbol})`,
        value: currency.currency_id,
      })),
  });

  const t = getLang("en"); 

  useEffect(() => {

    const fetchCurrency = async () => {
      try {
        const currencyRes = await getAllCurrency(1, 1000);
        setCurrencyOptions(currencyRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setCurrencyOptions([]);
      }
    };

    const fetchSupplier = async () => {
      try {
        const supplierRes = await getAllSupplier(1, 1000);
        setSupplierOptions(supplierRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setSupplierOptions([]);
      }
    };
    
    fetchCurrency();
    fetchSupplier();

    init();
  }, []);

  const init = async () => {
    setLoading(true);

    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    const info = getAuthInfo();
    setAuth(info);

    try {

    } catch (error: any){

    } finally {
      setLoading(false);
    }
  }
    


  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      qty: 1,
      uom: "PCS",
      unitPrice: 0,
      taxRate: 11,
    },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: "",
        qty: 1,
        uom: "PCS",
        unitPrice: 0,
        taxRate: 11,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (
    id: string,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const subtotal = items.reduce(
    (s, i) => s + i.qty * i.unitPrice,
    0
  );

  const taxTotal = items.reduce(
    (s, i) => s + (i.qty * i.unitPrice * i.taxRate) / 100,
    0
  );

  const grandTotal = subtotal + taxTotal;

  const handleSave = (mode: "draft" | "post") => {
    
  };  
  
  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading size="lg">{t.purchase_invoice.title}</Heading>
      
      {/* Invoice Details Card */}
      <Card.Root mt={4}>
        {/* Invoice Details Header */}
        <Card.Header>
          <Heading size="sm">{t.purchase_invoice.invoice_details}</Heading>
        </Card.Header>
        <Card.Body>
          {/* Invoice Details Fields */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {/* Supplier Field */}
            <Field.Root>
              <Field.Label>{t.supplier.supplier_name}</Field.Label>
              <Select.Root collection={supplierCollection} value={supplierSelected ? [supplierSelected] : []} onValueChange={(details) => setSupplierSelected(details.value[0])} size="sm" width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.purchase_invoice.supplier_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {supplierCollection.items.map((supplier) => (
                        <Select.Item item={supplier} key={supplier.value}>
                          {supplier.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
            {/* Invoice Number */}
            <Field.Root>
              <Field.Label>{t.purchase_invoice.invoice_number}</Field.Label>
              <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder={t.purchase_invoice.invoice_number_placeholder}/>
            </Field.Root>
            {/* Invoice Date */}
            <Field.Root>
              <Field.Label>{t.purchase_invoice.invoice_date}</Field.Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}/>
            </Field.Root>
            {/* Due Date */}
            <Field.Root>
              <Field.Label>{t.purchase_invoice.due_date}</Field.Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}/>
            </Field.Root>
            {/* Currency */}
            <Field.Root>
              <Field.Label>{t.purchase_invoice.currency}</Field.Label>
              <Select.Root collection={currencyCollection} value={currencySelected ? [currencySelected] : []} onValueChange={(details) => setCurrencySelected(details.value[0])} size="sm" width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.purchase_invoice.currency} />
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
                          {currency.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
            {/* Exchange Rate */}
            <Field.Root>
              <Field.Label>{t.purchase_invoice.exchange_rate}</Field.Label>
              <NumberInput.Root>
                <NumberInput.Control/>
                <NumberInput.Input/>
              </NumberInput.Root>
            </Field.Root>
            {/* PO Reference */}
            <Field.Root>
              <Field.Label>{t.purchase_invoice.po_reference}</Field.Label>
              <Input placeholder={t.purchase_invoice.po_reference_placeholder} value={poRef} onChange={(e) => setPoRef(e.target.value)}/>
            </Field.Root>
            {/* Notes */}
            <Field.Root gridColumn={{ md: "1 / span 3" }}>
              <Field.Label>{t.purchase_invoice.notes}</Field.Label>
              <Textarea placeholder={t.purchase_invoice.notes_placeholder} value={notes} onChange={(e) => setNotes(e.target.value)}/>
            </Field.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      <Card.Root mt={4}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="sm">{t.purchase_invoice.invoice_items}</Heading>
            <Button size="sm" onClick={addItem} variant="outline">
              <FaPlus/>{t.purchase_invoice.add_item}
            </Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>{t.purchase_invoice.description}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t.purchase_invoice.qty}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t.purchase_invoice.uom}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t.purchase_invoice.unit_price}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t.purchase_invoice.tax_percent}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t.purchase_invoice.line_total}</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {items.map((i) => {
                  const line = i.qty * i.unitPrice;
                  const lineWithTax = line + (line * i.taxRate) / 100;

                  return(
                    <Table.Row key={i.id}>
                      <Table.Cell>
                        <Input size="sm" value={i.description} onChange={(e) => updateItem(i.id, "description", e.target.value)} placeholder={t.purchase_invoice.description_placeholder}/>
                      </Table.Cell>
                      <Table.Cell>
                        <NumberInput.Root>
                          <NumberInput.Control/>
                          <NumberInput.Input/>
                        </NumberInput.Root>
                      </Table.Cell>
                      <Table.Cell>
                        <Input size="sm" value={i.uom} onChange={(e) => updateItem(i.id, "uom", e.target.value)} placeholder={t.purchase_invoice.uom}/>
                      </Table.Cell>
                      <Table.Cell>
                        <NumberInput.Root>
                          <NumberInput.Control/>
                          <NumberInput.Input/>
                        </NumberInput.Root>
                      </Table.Cell>
                      <Table.Cell>
                        <NumberInput.Root>
                          <NumberInput.Control/>
                          <NumberInput.Input/>
                        </NumberInput.Root>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontWeight="medium"> {lineWithTax.toLocaleString()}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <IconButton aria-label="Remove" size="sm" variant="ghost" color={"red"} onClick={() => removeItem(i.id)}>
                          <FaTrash/> {t.purchase_invoice.delete}
                        </IconButton>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
          </Table.Root>
          
          <Flex justify="flex-end" mt={8}>
              <Box minW="280px">
                <Flex justify="space-between" mb={2}>
                  <Text color="gray.600">{t.purchase_invoice.subtotal}</Text>
                  <Text fontWeight="medium">{subtotal.toLocaleString()}</Text>
                </Flex>
                <Flex justify="space-between" mb={2}>
                  <Text color="gray.600">{t.purchase_invoice.tax}</Text>
                  <Text fontWeight="medium">{taxTotal.toLocaleString()}</Text>
                </Flex>
                <Separator />
                <Flex justify="space-between">
                  <Text fontWeight="semibold">{t.purchase_invoice.grand_total}</Text>
                  <Text fontWeight="semibold">{grandTotal.toLocaleString()}</Text>
                </Flex>
              </Box>
          </Flex>

          <Flex justify="space-between" mt={8}>
            <Button variant="outline"  onClick={() => handleSave("draft")}>{t.purchase_invoice.save_draft}</Button>
            <Button colorScheme="teal" onClick={() => handleSave("post")}>{t.purchase_invoice.post_invoice}</Button>
          </Flex>

        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
    
  );
}
