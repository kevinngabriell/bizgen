"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { Box, Button, Card, Separator, Flex, Field, Heading, IconButton, Input, NumberInput, SimpleGrid, Table, Text, Textarea } from "@chakra-ui/react";
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
  const [supplier, setSupplier] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [poRef, setPoRef] = useState("");
  const [notes, setNotes] = useState("");

  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
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
    
  if (loading) return <Loading/>;

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

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading size="lg">Create Purchase Invoice</Heading>
      
      {/* Invoice Details Card */}
      <Card.Root mt={4}>
        {/* Invoice Details Header */}
        <Card.Header>
          <Heading size="sm">Invoice Details</Heading>
        </Card.Header>
        <Card.Body>
          {/* Invoice Details Fields */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {/* Supplier Field */}
            <Field.Root>
              <Field.Label>Supplier</Field.Label>
              <Input placeholder="Select / search supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)}/>
            </Field.Root>
            {/* Invoice Number */}
            <Field.Root>
              <Field.Label>Invoice No.</Field.Label>
              <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="INV-xxx"/>
            </Field.Root>
            {/* Invoice Date */}
            <Field.Root>
              <Field.Label>Invoice Date</Field.Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}/>
            </Field.Root>
            {/* Due Date */}
            <Field.Root>
              <Field.Label>Due Date</Field.Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}/>
            </Field.Root>
            {/* Currency */}
            <Field.Root>
              <Field.Label>Currency</Field.Label>
              {/* <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
                <option value="EUR">EUR</option>
              </Select> */}
            </Field.Root>
            {/* Exchange Rate */}
            <Field.Root>
              <Field.Label>Exchange Rate</Field.Label>
              <NumberInput.Root>
                <NumberInput.Control/>
                <NumberInput.Input/>
              </NumberInput.Root>
            </Field.Root>
            {/* PO Reference */}
            <Field.Root>
              <Field.Label>PO Reference</Field.Label>
              <Input placeholder="Optional — link to PO" value={poRef} onChange={(e) => setPoRef(e.target.value)}/>
            </Field.Root>
            {/* Notes */}
            <Field.Root gridColumn={{ md: "1 / span 3" }}>
              <Field.Label>Notes</Field.Label>
              <Textarea placeholder="Additional information…" value={notes} onChange={(e) => setNotes(e.target.value)}/>
            </Field.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      <Card.Root mt={4}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="sm">Invoice Items</Heading>
            <Button size="sm" onClick={addItem} variant="outline">
              <FaPlus/>Add Item
            </Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Description</Table.ColumnHeader>
                  <Table.ColumnHeader>Qty</Table.ColumnHeader>
                  <Table.ColumnHeader>UOM</Table.ColumnHeader>
                  <Table.ColumnHeader>Unit Price</Table.ColumnHeader>
                  <Table.ColumnHeader>Tax %</Table.ColumnHeader>
                  <Table.ColumnHeader>Line Total</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {items.map((i) => {
                  const line = i.qty * i.unitPrice;
                  const lineWithTax = line + (line * i.taxRate) / 100;

                  return(
                    <Table.Row key={i.id}>
                      <Table.Cell>
                        <Input size="sm" value={i.description} onChange={(e) => updateItem(i.id, "description", e.target.value)}placeholder="Item description"/>
                      </Table.Cell>
                      <Table.Cell>
                        <NumberInput.Root>
                          <NumberInput.Control/>
                          <NumberInput.Input/>
                        </NumberInput.Root>
                      </Table.Cell>
                      <Table.Cell>
                        <Input size="sm" value={i.uom} onChange={(e) => updateItem(i.id, "uom", e.target.value)} placeholder="UoM"/>
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
                          <FaTrash/> Delete
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
                  <Text color="gray.600">Subtotal</Text>
                  <Text fontWeight="medium">{subtotal.toLocaleString()}</Text>
                </Flex>
                <Flex justify="space-between" mb={2}>
                  <Text color="gray.600">Tax</Text>
                  <Text fontWeight="medium">{taxTotal.toLocaleString()}</Text>
                </Flex>
                <Separator />
                <Flex justify="space-between">
                  <Text fontWeight="semibold">Grand Total</Text>
                  <Text fontWeight="semibold">{grandTotal.toLocaleString()}</Text>
                </Flex>
              </Box>
          </Flex>

          <Flex justify="space-between" mt={8}>
            <Button variant="outline"  onClick={() => handleSave("draft")}>Save as Draft</Button>
            <Button colorScheme="teal" onClick={() => handleSave("post")}>Post Invoice</Button>
          </Flex>

        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
    
  );
}
