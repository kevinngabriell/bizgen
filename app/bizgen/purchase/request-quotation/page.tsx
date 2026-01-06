
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
  Select,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
// import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { useState } from "react";

type ItemRow = {
  id: string;
  description: string;
  hsCode: string;
  qty: string;
  uom: string;
  unitPrice: string;
  currency: string;
};

export default function CreateRequestQuotationPage() {
//   const toast = useToast();

  const [items, setItems] = useState<ItemRow[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      hsCode: "",
      qty: "",
      uom: "",
      unitPrice: "",
      currency: "USD",
    },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: "",
        hsCode: "",
        qty: "",
        uom: "",
        unitPrice: "",
        currency: "USD",
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ItemRow, value: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const handleSubmit = () => {
    // TODO: integrate with API
    // toast({
    //   title: "Request Quotation saved",
    //   description: "Draft has been created successfully.",
    //   status: "success",
    //   duration: 3000,
    //   isClosable: true,
    // });
  };

  return (
    <Box px={{ base: 4, md: 6 }} py={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="xl" fontWeight="bold">
          Create Request Quotation
        </Text>

        <HStack gap={3}>
          <Button variant="outline" onClick={handleSubmit}>
            Save as Draft
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit}>
            Submit Request
          </Button>
        </HStack>
      </Flex>

      {/* CUSTOMER + SHIPMENT INFO */}
      <Card.Root mb={6}>
        <Card.Header>
          <Text fontWeight="semibold">Request Details</Text>
        </Card.Header>
        <Separator />
        <Card.Body>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
            <GridItem>
              <Field.Root>
                <Field.Label>Inquiry Reference (optional)</Field.Label>
                <Input placeholder="Select or input inquiry reference" />
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>Customer / Buyer</Field.Label>
                <Input placeholder="Customer name" />
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>Contact Person</Field.Label>
                <Input placeholder="Contact person name" />
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>WhatsApp / Phone</Field.Label>
                <Input placeholder="+62…" />
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>Shipment Type</Field.Label>
                {/* <Select placeholder="Select shipment type">
                  <option>Import</option>
                  <option>Export</option>
                  <option>Domestic</option>
                </Select> */}
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>Service Type</Field.Label>
                {/* <Select placeholder="Choose service type">
                  <option>Freight Forwarding</option>
                  <option>Customs Clearance</option>
                  <option>Trucking</option>
                  <option>Warehouse</option>
                </Select> */}
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>Origin</Field.Label>
                <Input placeholder="City / Port of loading" />
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>Destination</Field.Label>
                <Input placeholder="City / Port of discharge" />
              </Field.Root>
            </GridItem>

            <GridItem colSpan={{ base: 1, md: 2 }}>
              <Field.Root>
                <Field.Label>Additional Notes</Field.Label>
                <Textarea placeholder="Add shipment context, special handling, etc." />
              </Field.Root>
            </GridItem>
          </Grid>
        </Card.Body>
      </Card.Root>

      {/* ITEM DETAILS */}
      <Card.Root mb={6}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Text fontWeight="semibold">Goods / Item Details</Text>
            <Button size="sm" onClick={addItem}>
              Add Item
            </Button>
          </Flex>
        </Card.Header>
        <Separator />
        <Card.Body>
          <Stack gap={5}>
            {items.map((item, index) => (
              <Box
                key={item.id}
                p={3}
                borderWidth="1px"
                borderRadius="md"
                bg="gray.50"
              >
                <Flex justify="space-between" mb={2}>
                  <Text fontWeight="medium">
                    Item {index + 1}
                  </Text>
                  {items.length > 1 && (
                    <IconButton
                      aria-label="Remove item"
                      
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => removeItem(item.id)}
                    />
                  )}
                </Flex>

                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
                  gap={4}
                >
                  <GridItem colSpan={{ base: 1, md: 2 }}>
                    <Field.Root>
                      <Field.Label>Description</Field.Label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, "description", e.target.value)
                        }
                        placeholder="Product description"
                      />
                    </Field.Root>
                  </GridItem>

                  <GridItem>
                    <Field.Root>
                      <Field.Label>HS Code</Field.Label>
                      <Input
                        value={item.hsCode}
                        onChange={(e) =>
                          updateItem(item.id, "hsCode", e.target.value)
                        }
                        placeholder="e.g. 09012120"
                      />
                    </Field.Root>
                  </GridItem>

                  <GridItem>
                    <Field.Root>
                      <Field.Label>Currency</Field.Label>
                      {/* <Select
                        value={item.currency}
                        onChange={(e) =>
                          updateItem(item.id, "currency", e.target.value)
                        }
                      >
                        <option value="USD">USD</option>
                        <option value="IDR">IDR</option>
                        <option value="EUR">EUR</option>
                        <option value="SGD">SGD</option>
                      </Select> */}
                    </Field.Root>
                  </GridItem>

                  <GridItem>
                    <Field.Root>
                      <Field.Label>Quantity</Field.Label>
                      <Input
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(item.id, "qty", e.target.value)
                        }
                        placeholder="0"
                      />
                    </Field.Root>
                  </GridItem>

                  <GridItem>
                    <Field.Root>
                      <Field.Label>UOM</Field.Label>
                      <Input
                        value={item.uom}
                        onChange={(e) =>
                          updateItem(item.id, "uom", e.target.value)
                        }
                        placeholder="CTN / KG / PCS"
                      />
                    </Field.Root>
                  </GridItem>

                  <GridItem>
                    <Field.Root>
                      <Field.Label>Unit Price</Field.Label>
                      <Input
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.id, "unitPrice", e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </Field.Root>
                  </GridItem>
                </Grid>
              </Box>
            ))}
          </Stack>
        </Card.Body>
      </Card.Root>

      {/* ACTION FOOTER */}
      <Flex justify="flex-end" gap={3}>
        <Button variant="outline" onClick={handleSubmit}>
          Save as Draft
        </Button>
        <Button colorScheme="blue" onClick={handleSubmit}>
          Submit Request
        </Button>
      </Flex>
    </Box>
  );
}