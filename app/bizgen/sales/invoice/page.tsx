

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
//   NumberDecrementStepper,
//   NumberIncrementStepper,
//   NumberInput,
//   NumberInputField,
//   NumberInputStepper,
  Select,
  Stack,
  Text,
  Textarea,
//   useToast,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import dayjs from "dayjs";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export default function CreateInvoicePage() {
//   const toast = useToast();

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

    // toast({
    //   title: "Invoice saved",
    //   description: "Invoice has been created successfully",
    //   status: "success",
    //   duration: 3000,
    // });
  };

  return (
    <Box p={6}>
      <Card.Root variant="outline">
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="xl" fontWeight="bold">
                Create Invoice / Billing
              </Text>
              <Text color="gray.500" fontSize="sm">
                Generate billing for a completed job or milestone
              </Text>
            </Box>
            <HStack gap={3}>
              <Button variant="outline">Preview PDF</Button>
              <Button colorScheme="blue" onClick={handleSubmit}>
                Save Invoice
              </Button>
            </HStack>
          </Flex>
        </Card.Header>

        <Separator />

        <Card.Body>
          <Stack gap={8}>
            {/* Header Info */}
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
              <GridItem>
                <Field.Root>
                  <Field.Label>Invoice Number</Field.Label>
                  <Input
                    placeholder="INV-2026-001"
                    value={form.invoiceNo}
                    onChange={handleChange("invoiceNo")}
                  />
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>Invoice Date</Field.Label>
                  <Input
                    type="date"
                    value={form.invoiceDate}
                    onChange={handleChange("invoiceDate")}
                  />
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>Due Date</Field.Label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={handleChange("dueDate")}
                  />
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>Customer</Field.Label>
                  <Input
                    placeholder="Customer Name"
                    value={form.customer}
                    onChange={handleChange("customer")}
                  />
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>Job / Reference</Field.Label>
                  <Input
                    placeholder="JOB-REF-001"
                    value={form.jobRef}
                    onChange={handleChange("jobRef")}
                  />
                </Field.Root>
              </GridItem>

              <GridItem>
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
              </GridItem>

              <GridItem>
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
              </GridItem>
            </Grid>

            {/* Line Items */}
            <Box>
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontWeight="semibold">Invoice Line Items</Text>
                <Button
                  size="sm"
                //   leftIcon={<AddIcon />}
                  variant="outline"
                  onClick={addItem}
                >
                  Add Item
                </Button>
              </Flex>

              <Stack gap={4}>
                {items.map((it) => {
                  const amount = (it.quantity || 0) * (it.unitPrice || 0);

                  return (
                    <Card.Root key={it.id} variant="subtle">
                      <Card.Body>
                        <Grid
                          templateColumns={{
                            base: "1fr",
                            md: "3fr 1fr 1fr 1fr auto",
                          }}
                          gap={4}
                          alignItems="end"
                        >
                          <GridItem>
                            <Field.Root>
                              <Field.Label>Description</Field.Label>
                              <Input
                                placeholder="Service / Charge Description"
                                value={it.description}
                                onChange={(e) =>
                                  updateItem(it.id, {
                                    description: e.target.value,
                                  })
                                }
                              />
                            </Field.Root>
                          </GridItem>

                          <GridItem>
                            <Field.Root>
                              <Field.Label>Qty</Field.Label>
                              {/* <NumberInput
                                min={0}
                                value={it.quantity}
                                onChange={(_, v) =>
                                  updateItem(it.id, { quantity: v || 0 })
                                }
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput> */}
                            </Field.Root>
                          </GridItem>

                          <GridItem>
                            <Field.Root>
                              <Field.Label>Unit Price</Field.Label>
                              {/* <NumberInput
                                min={0}
                                precision={2}
                                value={it.unitPrice}
                                onChange={(_, v) =>
                                  updateItem(it.id, { unitPrice: v || 0 })
                                }
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput> */}
                            </Field.Root>
                          </GridItem>

                          <GridItem>
                            <Field.Root>
                              <Field.Label>Amount</Field.Label>
                              <Input
                                
                                value={amount.toLocaleString()}
                              />
                            </Field.Root>
                          </GridItem>

                          <GridItem>
                            <IconButton
                              aria-label="Remove"
                            //   icon={<DeleteIcon />}
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => removeItem(it.id)}
                            //   isDisabled={items.length === 1}
                            />
                          </GridItem>
                        </Grid>
                      </Card.Body>
                    </Card.Root>
                  );
                })}
              </Stack>
            </Box>

            {/* Totals */}
            <Box>
              <Grid
                templateColumns={{ base: "1fr", md: "1fr 300px" }}
                gap={6}
                alignItems="start"
              >
                <GridItem>
                  <Field.Root>
                    <Field.Label>Notes (shown on invoice)</Field.Label>
                    <Textarea
                      placeholder="Payment instructions, bank details, remarks…"
                      value={form.notes}
                    //   onChange={handleChange("notes")}
                    />
                  </Field.Root>
                </GridItem>

                <GridItem>
                  <Card.Root variant="outline">
                    <Card.Body>
                      <Stack gap={3}>
                        <HStack justify="space-between">
                          <Text color="gray.600">Subtotal</Text>
                          <Text fontWeight="semibold">
                            {subTotal.toLocaleString()}
                          </Text>
                        </HStack>

                        <Field.Root>
                          <Field.Label>Tax (%)</Field.Label>
                          {/* <NumberInput
                            min={0}
                            max={100}
                            precision={2}
                            value={taxPercent}
                            onChange={(_, v) =>
                              setTaxPercent(isNaN(v) ? 0 : v)
                            }
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput> */}
                        </Field.Root>

                        <HStack justify="space-between">
                          <Text color="gray.600">Tax Amount</Text>
                          <Text fontWeight="semibold">
                            {taxAmount.toLocaleString()}
                          </Text>
                        </HStack>

                        <Separator />

                        <HStack justify="space-between">
                          <Text fontWeight="bold">Grand Total</Text>
                          <Text fontWeight="bold">
                            {grandTotal.toLocaleString()} {form.currency}
                          </Text>
                        </HStack>
                      </Stack>
                    </Card.Body>
                  </Card.Root>
                </GridItem>
              </Grid>
            </Box>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}