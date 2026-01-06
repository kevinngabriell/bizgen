

"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Field,
  Input,
  Select,
  NumberInput,
  IconButton,
  Separator,
  Text,
  Stack,
} from "@chakra-ui/react";
// import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { useState, useMemo } from "react";

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
    <Box p={6}>
      <Flex mb={4} align="center" justify="space-between">
        <Heading size="lg">Create Purchase — Import</Heading>
      </Flex>

      <Stack gap={8}>
        {/* Header Info */}
        <Box borderWidth="1px" borderRadius="lg" p={4}>
          <Heading size="sm" mb={3}>
            Purchase Details
          </Heading>
          <SimpleGrid columns={[1, 2, 3]} gap={4}>
            <Field.Root>
              <Field.Label>PO Number</Field.Label>
              <Input
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="AUTO / Manual"
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>PO Date</Field.Label>
              <Input
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>Supplier</Field.Label>
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Supplier Name"
              />
            </Field.Root>
          </SimpleGrid>

          <Separator my={4} />

          <Heading size="sm" mb={3}>
            Import Details
          </Heading>
          <SimpleGrid columns={[1, 2, 3]} gap={4}>
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

            <Field.Root>
              <Field.Label>Port of Loading</Field.Label>
              <Input
                value={portOfLoading}
                onChange={(e) => setPortOfLoading(e.target.value)}
                placeholder="e.g. Shanghai"
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Port of Discharge</Field.Label>
              <Input
                value={portOfDischarge}
                onChange={(e) => setPortOfDischarge(e.target.value)}
                placeholder="e.g. Jakarta"
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Freight Cost ({currency})</Field.Label>
              {/* <NumberInput
                value={freightCost}
                min={0}
                onChange={(_, v) => setFreightCost(v || 0)}
              >
                <NumberInputField />
              </NumberInput> */}
            </Field.Root>

            <Field.Root>
              <Field.Label>Customs / Duty Cost ({currency})</Field.Label>
              {/* <NumberInput
                value={customsCost}
                min={0}
                onChange={(_, v) => setCustomsCost(v || 0)}
              >
                <NumberInputField />
              </NumberInput> */}
            </Field.Root>
          </SimpleGrid>
        </Box>

        {/* Items */}
        <Box borderWidth="1px" borderRadius="lg" p={4}>
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="sm">Items</Heading>
            <Button
            //   leftIcon={<AddIcon />}
              size="sm"
              variant="outline"
              onClick={addItem}
            >
              Add Item
            </Button>
          </Flex>

          <Stack gap={3}>
            {items.map((row, i) => (
              <Box
                key={i}
                p={3}
                borderWidth="1px"
                borderRadius="md"
                bg="gray.50"
              >
                <SimpleGrid columns={[1, 2, 4]} gap={3}>
                  <Field.Root>
                    <Field.Label>SKU</Field.Label>
                    <Input
                      value={row.sku}
                      onChange={(e) =>
                        updateItem(i, "sku", e.target.value)
                      }
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Input
                      value={row.description}
                      onChange={(e) =>
                        updateItem(i, "description", e.target.value)
                      }
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Qty</Field.Label>
                    {/* <NumberInput
                      value={row.qty}
                      min={1}
                      onChange={(_, v) => updateItem(i, "qty", v || 0)}
                    >
                      <NumberInputField />
                    </NumberInput> */}
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Unit Price ({currency})</Field.Label>
                    {/* <NumberInput
                      value={row.unitPrice}
                      min={0}
                      onChange={(_, v) =>
                        updateItem(i, "unitPrice", v || 0)
                      }
                    >
                      <NumberInputField />
                    </NumberInput> */}
                  </Field.Root>
                </SimpleGrid>

                <Flex justify="space-between" mt={2} align="center">
                  <Text fontSize="sm" color="gray.600">
                    Line Total:{" "}
                    {(row.qty || 0) * (row.unitPrice || 0)} {currency}
                  </Text>
                  {items.length > 1 && (
                    <IconButton
                      aria-label="Remove item"
                    //   icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => removeItem(i)}
                    />
                  )}
                </Flex>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Totals */}
        <Box borderWidth="1px" borderRadius="lg" p={4}>
          <Heading size="sm" mb={3}>
            Cost Summary
          </Heading>
          <Stack gap={1}>
            <Text>
              Items Subtotal: {itemsSubtotal.toLocaleString()} {currency}
            </Text>
            <Text>
              Freight + Customs:{" "}
              {(Number(freightCost) + Number(customsCost)).toLocaleString()}{" "}
              {currency}
            </Text>
            <Text fontWeight="semibold">
              Landed Cost: {landedCost.toLocaleString()} {currency}
            </Text>
            <Text color="gray.600">
              Local Currency (IDR): {localCurrencyTotal.toLocaleString("id-ID")}
            </Text>
          </Stack>
        </Box>

        {/* Actions */}
        <Flex gap={3} justify="flex-end">
          <Button variant="outline">Save Draft</Button>
          <Button colorScheme="blue">Submit Purchase</Button>
        </Flex>
      </Stack>
    </Box>
  );
}