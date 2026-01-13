"use client";

import {Box, Button, Card, Separator, Flex, Field, Grid, GridItem, HStack, IconButton, Input, Select, Stack, Text, Textarea, Heading, SimpleGrid, NumberInput} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import dayjs from "dayjs";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { FaTrash } from "react-icons/fa";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export default function CreateInvoicePage() {
  const [form, setForm] = useState({
    invoiceNo: "",
    invoiceDate: dayjs().format("YYYY-MM-DD"),
    customer: "",
    jobRef: "",
    currency: "IDR",
    rate: 1,
    dueDate: "",
    notes: "",
  });

  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
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
    () => (subTotal * (taxPercent || 0)) / 100,
    [subTotal, taxPercent]
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
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
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

  return (
    <SidebarWithHeader username="---">
      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Flex flexDir={"column"}>
              <Heading>Create Invoice / Billing</Heading>
              <Text fontSize={"sm"} color="gray.500">Generate billing for a completed job or milestone</Text>
            </Flex>

            <Flex gap={3}>
              <Button variant="outline">Preview PDF</Button>
              <Button colorScheme="blue" onClick={handleSubmit}>Save Invoice</Button>
            </Flex>
          </Flex>
        </Card.Header>

        <Card.Body>
          <SimpleGrid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
            <Field.Root>
              <Field.Label>Invoice Number</Field.Label>
              <Input placeholder="INV-2026-001" value={form.invoiceNo} onChange={handleChange("invoiceNo")}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Invoice Date</Field.Label>
              <Input type="date" value={form.invoiceDate} onChange={handleChange("invoiceDate")}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Due Date</Field.Label>
              <Input type="date" value={form.dueDate} onChange={handleChange("dueDate")}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Customer</Field.Label>
              <Input placeholder="Customer Name" value={form.customer} onChange={handleChange("customer")}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Job / Reference</Field.Label>
              <Input placeholder="JOB-REF-001" value={form.jobRef} onChange={handleChange("jobRef")}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Currency</Field.Label>
                  {/* <Select
                    value={form.currency}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, currency: e.target.value }))
                    }
                  >
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                    <option value="SGD">SGD</option>
                    <option value="EUR">EUR</option>
                  </Select> */}
            </Field.Root>
            <Field.Root>
              <Field.Label>Exchange Rate (to IDR)</Field.Label>
                  {/* <NumberInput
                    min={0}
                    precision={2}
                    value={form.rate}
                    onChange={handleNumChange("rate")}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput> */}
            </Field.Root>
          </SimpleGrid>

          <Flex justify="space-between" align="center" mb={3}>
            <Text fontWeight="semibold">Invoice Line Items</Text>
            <Button size="sm" variant="outline" onClick={addItem}>Add Item</Button>
          </Flex>

          {items.map((it) => {
            const amount = (it.quantity || 0) * (it.unitPrice || 0);

            return(
              <Card.Root key={it.id} variant="subtle">
                <Card.Body>
                  <SimpleGrid templateColumns={{base: "1fr", md: "3fr 1fr 1fr 1fr auto"}} gap={4} alignItems="end">
                    <Field.Root>
                      <Field.Label>Description</Field.Label>
                      <Input placeholder="Service / Charge Description" value={it.description} onChange={(e) => updateItem(it.id, {description: e.target.value,})}/>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Qty</Field.Label>
                      <NumberInput.Root>
                        <NumberInput.Control/>
                        <NumberInput.Input/>
                      </NumberInput.Root>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Unit Price</Field.Label>
                      <NumberInput.Root>
                        <NumberInput.Control/>
                        <NumberInput.Input/>
                      </NumberInput.Root>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Amount</Field.Label>
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
              <Field.Label>Notes (shown on invoice)</Field.Label>
              <Textarea placeholder="Payment instructions, bank details, remarks…" value={form.notes}/>
            </Field.Root>

            <Card.Root>
              <Card.Body>
                <Flex justify="space-between">
                  <Text color="gray.600">Subtotal</Text>
                  <Text fontWeight="semibold">{subTotal.toLocaleString()}</Text>
                </Flex>

                <Field.Root mt={3}>
                  <Field.Label>Tax (%)</Field.Label>
                  <NumberInput.Root>
                    <NumberInput.Control/>
                    <NumberInput.Input/>
                  </NumberInput.Root>
                </Field.Root>

                <Flex justify="space-between" mt={3}>
                  <Text color="gray.600">Tax Amount</Text>
                  <Text fontWeight="semibold">{taxAmount.toLocaleString()}</Text>
                </Flex>

                <Separator mt={3}/>

                <Flex justify="space-between" mt={3}>
                  <Text fontWeight="bold">Grand Total</Text>
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