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
  IconButton,
  Input,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";
// import { AddIcon, DeleteIcon } from "@chakra-ui/icons";

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  tax: number;
}

export default function CreateVendorBillPage() {
//   const toast = useToast();

  const [vendor, setVendor] = useState("");
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", qty: 1, unitPrice: 0, tax: 0 },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", qty: 1, unitPrice: 0, tax: 0 },
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
    (sum, i) => sum + (i.qty * i.unitPrice * (i.tax || 0)) / 100,
    0
  );

  const grandTotal = subtotal + taxTotal;

  const handleSave = (mode: "draft" | "post") => {
    // TODO: integrate API submit
    // toast({
    //   title: mode === "draft" ? "Saved as draft" : "Vendor bill posted",
    //   status: "success",
    //   duration: 2000,
    // });
  };

  return (
    <Box p={6}>
      <Card.Root>
        <Card.Header>
          <Text fontSize="lg" fontWeight="bold">
            Create Vendor Bill
          </Text>
        </Card.Header>
        <Separator />
        <Card.Body>
          <Stack gap={6}>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
              <GridItem>
                <Field.Root>
                  <Field.Label>Vendor</Field.Label>
                  {/* <Select
                    placeholder="Select vendor"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                  >
                    <option value="vendor-1">Vendor A</option>
                    <option value="vendor-2">Vendor B</option>
                  </Select> */}
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>Reference (PO / GR / Job)</Field.Label>
                  <Input
                    placeholder="Optional reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>Bill No.</Field.Label>
                  <Input
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="Invoice number from vendor"
                  />
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>Bill Date</Field.Label>
                  <Input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                  />
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>Due Date</Field.Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>Currency</Field.Label>
                  <HStack>
                    {/* <Select
                      w="40%"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="IDR">IDR</option>
                      <option value="USD">USD</option>
                      <option value="SGD">SGD</option>
                    </Select>
                    <NumberInput
                      value={exchangeRate}
                      min={0}
                      onChange={(_, v) => setExchangeRate(v || 0)}
                    >
                      <NumberInputField placeholder="Rate" />
                    </NumberInput> */}
                  </HStack>
                </Field.Root>
              </GridItem>
            </Grid>

            <Box>
              <Text fontWeight="semibold" mb={2}>
                Line Items
              </Text>

              <Stack gap={3}>
                {items.map((item) => (
                  <Card.Root key={item.id} variant="outline">
                    <Card.Body>
                      <Grid
                        templateColumns={{
                          base: "1fr",
                          md: "2fr 1fr 1fr 1fr auto",
                        }}
                        gap={3}
                        alignItems="center"
                      >
                        <GridItem>
                          <Field.Root>
                            <Field.Label>Description</Field.Label>
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                updateItem(item.id, "description", e.target.value)
                              }
                              placeholder="Item / service description"
                            />
                          </Field.Root>
                        </GridItem>

                        <GridItem>
                          <Field.Root>
                            <Field.Label>Qty</Field.Label>
                            {/* <NumberInput
                              min={1}
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
                              value={item.unitPrice}
                              onChange={(_, v) =>
                                updateItem(item.id, "unitPrice", v || 0)
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
                              value={item.tax}
                              onChange={(_, v) =>
                                updateItem(item.id, "tax", v || 0)
                              }
                            >
                              <NumberInputField />
                            </NumberInput> */}
                          </Field.Root>
                        </GridItem>

                        <GridItem>
                          <IconButton
                            aria-label="Remove row"
                            // icon={<DeleteIcon />}
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => removeItem(item.id)}
                          />
                        </GridItem>
                      </Grid>
                    </Card.Body>
                  </Card.Root>
                ))}

                <Button
                //   leftIcon={<AddIcon />}
                  variant="outline"
                  onClick={addItem}
                  alignSelf="flex-start"
                >
                  Add Line Item
                </Button>
              </Stack>
            </Box>

            <Grid templateColumns={{ base: "1fr", md: "1fr 300px" }} gap={6}>
              <GridItem>
                <Field.Root>
                  <Field.Label>Notes</Field.Label>
                  <Textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes for internal / finance"
                  />
                </Field.Root>
              </GridItem>

              <GridItem>
                <Card.Root variant="outline">
                  <Card.Body>
                    <Stack gap={2}>
                      <HStack justify="space-between">
                        <Text color="gray.600">Subtotal</Text>
                        <Text fontWeight="semibold">
                          {subtotal.toLocaleString()}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="gray.600">Tax</Text>
                        <Text fontWeight="semibold">
                          {taxTotal.toLocaleString()}
                        </Text>
                      </HStack>
                      <Separator />
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Grand Total</Text>
                        <Text fontWeight="bold">
                          {grandTotal.toLocaleString()}
                        </Text>
                      </HStack>
                    </Stack>
                  </Card.Body>
                </Card.Root>
              </GridItem>
            </Grid>

            <Flex justify="space-between">
              <Button
                variant="outline"
                onClick={() => handleSave("draft")}
              >
                Save as Draft
              </Button>
              <HStack>
                <Button
                  colorScheme="blue"
                  onClick={() => handleSave("post")}
                >
                  Post Vendor Bill
                </Button>
              </HStack>
            </Flex>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
