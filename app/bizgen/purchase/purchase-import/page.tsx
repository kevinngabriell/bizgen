

"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Box, Button, Flex, Heading, SimpleGrid, Field, Input, IconButton, Separator, Text, Stack, Card, NumberInput } from "@chakra-ui/react";
// import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { useState, useMemo } from "react";
import { FaTrash } from "react-icons/fa";
import { FiDelete } from "react-icons/fi";

type ItemRow = {
  sku: string;
  description: string;
  qty: number;
  unitPrice: number;
};

export default function CreatePurchaseImportPage() {
  const [supplier, setSupplier] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(15000);
  const [incoterm, setIncoterm] = useState("FOB");
  const [portOfLoading, setPortOfLoading] = useState("");
  const [portOfDischarge, setPortOfDischarge] = useState("");
  const [freightCost, setFreightCost] = useState(0);
  const [customsCost, setCustomsCost] = useState(0);

  const [items, setItems] = useState<ItemRow[]>([
    { sku: "", description: "", qty: 1, unitPrice: 0 },
  ]);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { sku: "", description: "", qty: 1, unitPrice: 0 },
    ]);

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (
    index: number,
    field: keyof ItemRow,
    value: string | number
  ) =>
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );

  const itemsSubtotal = useMemo(
    () =>
      items.reduce(
        (sum, r) => sum + (Number(r.qty) || 0) * (Number(r.unitPrice) || 0),
        0
      ),
    [items]
  );

  const landedCost = useMemo(
    () => itemsSubtotal + Number(freightCost || 0) + Number(customsCost || 0),
    [itemsSubtotal, freightCost, customsCost]
  );

  const localCurrencyTotal = useMemo(
    () => landedCost * Number(exchangeRate || 1),
    [landedCost, exchangeRate]
  );

  return (
    <SidebarWithHeader username="--">
      {/* Heading Area */}
      <Heading size="lg">Create Purchase — Import</Heading>

      {/* Purchase details & import details card */}
      <Card.Root mt={4}>
        <Card.Body>
          {/* Purchase Details Header */}
          <Heading size="sm" mb={3}>Purchase Details</Heading>

          {/* PO Number, PO Date, and Supplier Name */}
          <SimpleGrid columns={{base: 1, md: 2, lg: 3}} gap={"20px"} mt={3} mb={8}>
            {/* PO Number */}
            <Field.Root>
              <Field.Label>PO Number</Field.Label>
              <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="AUTO / Manual"/>
            </Field.Root>
            {/* PO Date */}
            <Field.Root>
              <Field.Label>PO Date</Field.Label>
              <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="AUTO / Manual"/>
            </Field.Root>
            {/* Supplier Name */}
            <Field.Root>
              <Field.Label>Supplier Name</Field.Label>
              <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="AUTO / Manual"/>
            </Field.Root>
          </SimpleGrid>

          <Separator/>

          {/* Import Details Header */}
          <Heading size="sm" mb={3} mt={6}>Import Details</Heading>
          
          {/* Currency, exchange rate, incoterm, port of loading, port of dicharge, freight cost, customs/duty cost */}
          <SimpleGrid columns={{base: 1, md: 2, lg: 3}} gap={"20px"} mt={3} mb={3}>
            {/* Currency */}
            <Field.Root>
              <Field.Label>Currency</Field.Label>
              {/* <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="CNY">CNY</option>
                <option value="EUR">EUR</option>
                <option value="IDR">IDR</option>
              </Select> */}
            </Field.Root>
            {/* Exchange Rate */}
            <Field.Root>
              <Field.Label>Exchange Rate (to IDR)</Field.Label>
              {/* <NumberInput
                value={exchangeRate}
                min={0}
                onChange={(_, v) => setExchangeRate(v || 0)}
              >
                <NumberInputField />
              </NumberInput> */}
            </Field.Root>
            {/* Incoterm */}
            <Field.Root>
              <Field.Label>Incoterm</Field.Label>
              {/* <Select
                value={incoterm}
                onChange={(e) => setIncoterm(e.target.value)}
              >
                <option value="FOB">FOB</option>
                <option value="CIF">CIF</option>
                <option value="EXW">EXW</option>
              </Select> */}
            </Field.Root>
            {/* Port of Loading */}
            <Field.Root>
              <Field.Label>Port of Loading</Field.Label>
              <Input value={portOfLoading} onChange={(e) => setPortOfLoading(e.target.value)} placeholder="e.g. Shanghai"/>
            </Field.Root>
            {/* Port of Discharge */}
            <Field.Root>
              <Field.Label>Port of Discharge</Field.Label>
              <Input value={portOfDischarge} onChange={(e) => setPortOfDischarge(e.target.value)} placeholder="e.g. Jakarta"/>
            </Field.Root>
            {/* Freight Cost (USD) */}
            <Field.Root>
              <Field.Label>Freight Cost (USD)</Field.Label>
              {/* <NumberInput
                value={freightCost}
                min={0}
                onChange={(_, v) => setFreightCost(v || 0)}
              >
                <NumberInputField />
              </NumberInput> */}
            </Field.Root>
            {/* Customer/Duty Cost (USD) */}
            <Field.Root>
              <Field.Label>Custom/Duty Cost (USD)</Field.Label>
              {/* <NumberInput
                value={customsCost}
                min={0}
                onChange={(_, v) => setCustomsCost(v || 0)}
              >
                <NumberInputField />
              </NumberInput> */}
            </Field.Root>
          </SimpleGrid>

        </Card.Body>
      </Card.Root>
      
      {/* Items card */}
      <Card.Root mt={6}>
        <Card.Body>
          {/* Heading and add item button */}
          <Flex alignItems={"center"} justifyContent={"space-between"} mb={8}>
            <Heading size="sm">Items</Heading>
            <Button size="sm" variant="outline" onClick={addItem}>Add Item</Button>
          </Flex>

          {items.map((row, i) => (
            <Card.Root key={i} mb={5}>
              <Card.Body>
                  <SimpleGrid columns={{base: 1, md: 2, lg: 4}} gap={"20px"}>
                    <Field.Root>
                      <Field.Label>SKU</Field.Label>
                      <Input value={row.sku} onChange={(e) => updateItem(i, "sku", e.target.value)}/>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Description</Field.Label>
                      <Input value={row.description} onChange={(e) => updateItem(i, "description", e.target.value)}/>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Qty</Field.Label>
                      <NumberInput.Root min={0}>
                        <NumberInput.Control/>
                        <NumberInput.Input />
                      </NumberInput.Root>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Unit Price (USD)</Field.Label>
                      <NumberInput.Root min={0}>
                        <NumberInput.Control/>
                        <NumberInput.Input />
                      </NumberInput.Root>
                    </Field.Root>
                  </SimpleGrid>

                  <Flex justify="space-between" mt={2} align="center">
                    <Text fontSize="sm" color="gray.600"> Line Total:{" "} {(row.qty || 0) * (row.unitPrice || 0)} {currency}</Text>
                    {items.length > 1 && (
                      <IconButton p={3} aria-label="Remove item" size="sm" color={"red"} variant="ghost" onClick={() => removeItem(i)}>
                        <FaTrash/>
                        <Text>Delete Item</Text>
                      </IconButton>
                    )}
                  </Flex>
              </Card.Body>
            </Card.Root>
          ))}
        </Card.Body>
      </Card.Root>

      <Card.Root mt={6}>
        <Card.Body>
          <Heading size="sm" mb={3}>Cost Summary</Heading>
          
          <Text fontSize={"md"}>Items Subtotal: {itemsSubtotal.toLocaleString()} {currency}</Text>
          <Text>Freight + Customs:{" "} {(Number(freightCost) + Number(customsCost)).toLocaleString()}{" "}{currency}</Text>
          <Text fontWeight="semibold">Landed Cost: {landedCost.toLocaleString()} {currency}</Text>
          <Text color="gray.600">Local Currency (IDR): {localCurrencyTotal.toLocaleString("id-ID")}</Text>
        </Card.Body>
      </Card.Root>

      <Flex gap={3} justify="flex-end" mt={4}>
        <Button variant="outline">Save Draft</Button>
        <Button colorScheme="blue">Submit Purchase</Button>
      </Flex>

    </SidebarWithHeader>
    
  );
}