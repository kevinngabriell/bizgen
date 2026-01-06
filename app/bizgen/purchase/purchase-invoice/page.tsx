"use client";

import {
  Box,
  Button,
  Card,
  Separator,
  Flex,
  Field,
  HStack,
  Heading,
  IconButton,
  Input,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Textarea,
} from "@chakra-ui/react";
// import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { useState } from "react";

type InvoiceItem = {
  id: string;
  description: string;
  qty: number;
  uom: string;
  unitPrice: number;
  taxRate: number;
};

export default function CreatePurchaseInvoicePage() {
//   const toast = useToast();
  const [supplier, setSupplier] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [poRef, setPoRef] = useState("");
  const [notes, setNotes] = useState("");

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
    // TODO: integrate API
    // toast({
    //   title:
    //     mode === "draft"
    //       ? "Saved as draft"
    //       : "Invoice posted successfully",
    //   status: "success",
    // });
  };

  return (
    <Stack gap={6}>
      <Heading size="lg">Create Purchase Invoice</Heading>

      <Card.Root>
        <Card.Header>
          <Heading size="sm">Invoice Details</Heading>
        </Card.Header>
        <Card.Body as={Stack} gap={4}>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Field.Root>
              <Field.Label>Supplier</Field.Label>
              <Input
                placeholder="Select / search supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Invoice No.</Field.Label>
              <Input
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="INV-xxx"
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Invoice Date</Field.Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Due Date</Field.Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field.Root>

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

            <Field.Root>
              <Field.Label>Exchange Rate</Field.Label>
              {/* <NumberInput
                value={exchangeRate}
                min={0}
                precision={2}
                onChange={(_, v) => setExchangeRate(v || 0)}
              >
                <NumberInputField />
              </NumberInput> */}
            </Field.Root>

            <Field.Root>
              <Field.Label>PO Reference</Field.Label>
              <Input
                placeholder="Optional — link to PO"
                value={poRef}
                onChange={(e) => setPoRef(e.target.value)}
              />
            </Field.Root>

            <Field.Root gridColumn={{ md: "1 / span 3" }}>
              <Field.Label>Notes</Field.Label>
              <Textarea
                placeholder="Additional information…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="sm">Invoice Items</Heading>
            <Button
            //   leftIcon={<AddIcon />}
              size="sm"
              onClick={addItem}
              variant="outline"
            >
              Add Item
            </Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          {/* <Table size="sm">
            <Thead>
              <Tr>
                <Th>Description</Th>
                <Th isNumeric>Qty</Th>
                <Th>UoM</Th>
                <Th isNumeric>Unit Price</Th>
                <Th isNumeric>Tax %</Th>
                <Th isNumeric>Line Total</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((i) => {
                const line = i.qty * i.unitPrice;
                const lineWithTax = line + (line * i.taxRate) / 100;
                return (
                  <Tr key={i.id}>
                    <Td>
                      <Input
                        size="sm"
                        value={i.description}
                        onChange={(e) =>
                          updateItem(i.id, "description", e.target.value)
                        }
                        placeholder="Item description"
                      />
                    </Td>
                    <Td isNumeric>
                      <NumberInput
                        size="sm"
                        min={1}
                        value={i.qty}
                        onChange={(_, v) =>
                          updateItem(i.id, "qty", v || 0)
                        }
                      >
                        <NumberInputField />
                      </NumberInput>
                    </Td>
                    <Td>
                      <Input
                        size="sm"
                        value={i.uom}
                        onChange={(e) =>
                          updateItem(i.id, "uom", e.target.value)
                        }
                      />
                    </Td>
                    <Td isNumeric>
                      <NumberInput
                        size="sm"
                        min={0}
                        precision={2}
                        value={i.unitPrice}
                        onChange={(_, v) =>
                          updateItem(i.id, "unitPrice", v || 0)
                        }
                      >
                        <NumberInputField />
                      </NumberInput>
                    </Td>
                    <Td isNumeric>
                      <NumberInput
                        size="sm"
                        min={0}
                        max={100}
                        precision={2}
                        value={i.taxRate}
                        onChange={(_, v) =>
                          updateItem(i.id, "taxRate", v || 0)
                        }
                      >
                        <NumberInputField />
                      </NumberInput>
                    </Td>
                    <Td isNumeric>
                      <Text fontWeight="medium">
                        {lineWithTax.toLocaleString()}
                      </Text>
                    </Td>
                    <Td>
                      <IconButton
                        aria-label="Remove"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => removeItem(i.id)}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table> */}
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Body as={Stack} gap={3}>
          <Flex justify="flex-end">
            <Box minW="280px">
              <Stack gap={2}>
                <HStack justify="space-between">
                  <Text color="gray.600">Subtotal</Text>
                  <Text fontWeight="medium">
                    {subtotal.toLocaleString()}
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <Text color="gray.600">Tax</Text>
                  <Text fontWeight="medium">
                    {taxTotal.toLocaleString()}
                  </Text>
                </HStack>

                <Separator />

                <HStack justify="space-between">
                  <Text fontWeight="semibold">Grand Total</Text>
                  <Text fontWeight="semibold">
                    {grandTotal.toLocaleString()}
                  </Text>
                </HStack>
              </Stack>
            </Box>
          </Flex>

          <Flex justify="space-between" mt={2}>
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
            >
              Save as Draft
            </Button>

            <Button
              colorScheme="teal"
              onClick={() => handleSave("post")}
            >
              Post Invoice
            </Button>
          </Flex>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}
