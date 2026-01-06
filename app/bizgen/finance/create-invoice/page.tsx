

"use client";

import {
  Box,
  Button,
  Card,
  Separator,
  Flex,
  Field,
  Grid,
  GridItem,
  HStack,
  Heading,
  IconButton,
  Input,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";

type LineItem = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxPct: number;
};

export default function CreateInvoicePage() {
//   const toast = useToast();

  const [currency, setCurrency] = useState<string>("IDR");
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [items, setItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      qty: 1,
      unitPrice: 0,
      taxPct: 0,
    },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: "",
        qty: 1,
        unitPrice: 0,
        taxPct: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const subtotal = items.reduce(
    (sum, i) => sum + i.qty * i.unitPrice,
    0
  );
  const taxTotal = items.reduce(
    (sum, i) => sum + (i.qty * i.unitPrice * i.taxPct) / 100,
    0
  );
  const grandTotal = subtotal + taxTotal;

  const handleSave = (mode: "draft" | "post") => {
    // TODO: integrate with API
    // toast({
    //   title: mode === "draft" ? "Saved as Draft" : "Invoice Posted",
    //   description:
    //     mode === "draft"
    //       ? "Invoice has been saved as draft."
    //       : "Invoice has been posted successfully.",
    //   status: "success",
    //   duration: 3000,
    //   isClosable: true,
    // });
  };

  return (
    <VStack align="stretch" gap={6}>
      <Heading size="lg">Create Invoice</Heading>

      <Card.Root>
        <Card.Header>
          <Heading size="md">Invoice Details</Heading>
        </Card.Header>
        <Card.Body>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <GridItem>
              <Field.Root>
                <Field.Label>Customer</Field.Label>
                <Input placeholder="Select / Search Customer" />
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>Invoice No</Field.Label>
                <Input placeholder="INV-2026-0001" />
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>Invoice Date</Field.Label>
                <Input type="date" />
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>Due Date</Field.Label>
                <Input type="date" />
              </Field.Root>
            </GridItem>

            <GridItem>
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
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>Exchange Rate</Field.Label>
                {/* <NumberInput
                  min={0}
                  precision={2}
                  value={exchangeRate}
                  onChange={(_, v) => setExchangeRate(v || 0)}
                >
                  <NumberInputField />
                </NumberInput> */}
              </Field.Root>
            </GridItem>

            <GridItem colSpan={{ base: 1, md: 2 }}>
              <Field.Root>
                <Field.Label>Reference</Field.Label>
                <Input placeholder="(Optional) PO / Job / Shipment Ref" />
              </Field.Root>
            </GridItem>
          </Grid>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">Line Items</Heading>
            <Button
            //   leftIcon={<AddIcon />}
              size="sm"
              variant="outline"
              onClick={addItem}
            >
              Add Item
            </Button>
          </Flex>
        </Card.Header>

        <Card.Body>
          <Stack gap={4}>
            {items.map((item, idx) => (
              <Box
                key={item.id}
                borderWidth="1px"
                borderRadius="md"
                p={3}
              >
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium">
                    Item {idx + 1}
                  </Text>
                  {items.length > 1 && (
                    <IconButton
                      aria-label="Remove item"
                    //   icon={<DeleteIcon />}
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                    />
                  )}
                </HStack>

                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "2fr 1fr 1fr 1fr",
                  }}
                  gap={3}
                >
                  <GridItem>
                    <Field.Root>
                      <Field.Label>Description</Field.Label>
                      <Input
                        placeholder="Service / Product description"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                      />
                    </Field.Root>
                  </GridItem>

                  <GridItem>
                    <Field.Root>
                      <Field.Label>Qty</Field.Label>
                      {/* <NumberInput
                        min={0}
                        value={item.qty}
                        onChange={(_, v) =>
                          updateItem(item.id, "qty", v || 0)
                        }
                      >
                        <NumberInputField />
                      </NumberInput> */}
                    </Field.Root>
                  </GridItem>

                  <GridItem>
                    <Field.Root>
                      <Field.Label>Unit Price</Field.Label>
                      {/* <NumberInput
                        min={0}
                        precision={2}
                        value={item.unitPrice}
                        onChange={(_, v) =>
                          updateItem(
                            item.id,
                            "unitPrice",
                            v || 0
                          )
                        }
                      >
                        <NumberInputField />
                      </NumberInput> */}
                    </Field.Root>
                  </GridItem>

                  <GridItem>
                    <Field.Root>
                      <Field.Label>Tax %</Field.Label>
                      {/* <NumberInput
                        min={0}
                        max={100}
                        precision={2}
                        value={item.taxPct}
                        onChange={(_, v) =>
                          updateItem(
                            item.id,
                            "taxPct",
                            v || 0
                          )
                        }
                      >
                        <NumberInputField />
                      </NumberInput> */}
                    </Field.Root>
                  </GridItem>
                </Grid>
              </Box>
            ))}
          </Stack>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Heading size="md">Summary</Heading>
        </Card.Header>
        <Card.Body>
          <VStack align="stretch" gap={2}>
            <Flex justify="space-between">
              <Text>Subtotal</Text>
              <Text fontWeight="medium">
                {subtotal.toLocaleString()}
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text>Tax</Text>
              <Text fontWeight="medium">
                {taxTotal.toLocaleString()}
              </Text>
            </Flex>

            <Separator />

            <Flex justify="space-between">
              <Text fontWeight="semibold">Grand Total</Text>
              <Text fontWeight="semibold">
                {grandTotal.toLocaleString()} {currency}
              </Text>
            </Flex>
          </VStack>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Heading size="md">Notes</Heading>
        </Card.Header>
        <Card.Body>
          <Field.Root>
            <Field.Label>Notes (Optional)</Field.Label>
            <Textarea placeholder="Additional notes to customer…" />
          </Field.Root>
        </Card.Body>
      </Card.Root>

      <Flex gap={3} justify="flex-end">
        <Button variant="outline" onClick={() => handleSave("draft")}>
          Save as Draft
        </Button>
        <Button colorScheme="blue" onClick={() => handleSave("post")}>
          Post Invoice
        </Button>
      </Flex>
    </VStack>
  );
}