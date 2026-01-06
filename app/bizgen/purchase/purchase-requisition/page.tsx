"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  Separator,
  Field,
  Card,
} from "@chakra-ui/react";
import { useState } from "react";

type RequisitionItem = {
  id: string;
  description: string;
  qty: string;
  uom: string;
  estPrice: string;
  remarks: string;
};

export default function PurchaseRequisitionCreatePage() {
//   const toast = useToast();

  const [form, setForm] = useState({
    prNumber: "",
    prDate: "",
    requester: "",
    department: "",
    vendorPreference: "",
    currency: "IDR",
    notes: "",
  });

  const [items, setItems] = useState<RequisitionItem[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      qty: "",
      uom: "",
      estPrice: "",
      remarks: "",
    },
  ]);

  const handleItemChange = (
    id: string,
    field: keyof RequisitionItem,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: "",
        qty: "",
        uom: "",
        estPrice: "",
        remarks: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((it) => it.id !== id)));
  };

  const handleSubmit = (mode: "draft" | "submit") => {
    // TODO: integrate with API
    console.log("PURCHASE REQUISITION", { mode, form, items });

    // toast({
    //   title: mode === "draft" ? "Saved as draft" : "Submitted",
    //   description:
    //     mode === "draft"
    //       ? "Purchase Requisition has been saved as draft."
    //       : "Purchase Requisition successfully submitted.",
    //   status: "success",
    //   duration: 2500,
    //   isClosable: true,
    // });
  };

  return (
    <Container maxW="6xl" py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Create Purchase Requisition</Heading>
          <Text color="gray.500">
            Raise a request for purchasing goods / services.
          </Text>
        </Box>

        <HStack>
          <Button variant="outline" onClick={() => handleSubmit("draft")}>
            Save Draft
          </Button>
          <Button colorScheme="teal" onClick={() => handleSubmit("submit")}>
            Submit
          </Button>
        </HStack>
      </Flex>

      <Card.Root mb={6}>
        <Card.Header pb={2}>
          <Heading size="sm">Requisition Details</Heading>
        </Card.Header>
        <Card.Body>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <Field.Root>
              <Field.Label>PR Number</Field.Label>
              <Input
                placeholder="Auto / Manual"
                value={form.prNumber}
                onChange={(e) =>
                  setForm({ ...form, prNumber: e.target.value })
                }
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>PR Date</Field.Label>
              <Input
                type="date"
                value={form.prDate}
                onChange={(e) =>
                  setForm({ ...form, prDate: e.target.value })
                }
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Requester</Field.Label>
              <Input
                placeholder="Requester name"
                value={form.requester}
                onChange={(e) =>
                  setForm({ ...form, requester: e.target.value })
                }
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Department</Field.Label>
              <Input
                placeholder="Department / Division"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Preferred Vendor (Optional)</Field.Label>
              <Input
                placeholder="Vendor name"
                value={form.vendorPreference}
                onChange={(e) =>
                  setForm({ ...form, vendorPreference: e.target.value })
                }
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Currency</Field.Label>
              {/* <Select
                value={form.currency}
                onChange={(e) =>
                  setForm({ ...form, currency: e.target.value })
                }
              >
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
                <option value="EUR">EUR</option>
              </Select> */}
            </Field.Root>

            <GridItem colSpan={{ base: 1, md: 2 }}>
              <Field.Root>
                <Field.Label>Notes</Field.Label>
                <Textarea
                  rows={3}
                  placeholder="Additional instructions or justifications"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Field.Root>
            </GridItem>
          </Grid>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header pb={2}>
          <Flex justify="space-between" align="center">
            <Heading size="sm">Requested Items</Heading>
            <Button
              size="sm"
            //   leftIcon={<AddIcon />}
              onClick={addItem}
              variant="outline"
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
                bg="gray.50"
              >
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontWeight="semibold">
                    Item #{idx + 1}
                  </Text>
                  <IconButton
                    aria-label="Remove item"
                    size="sm"
                    // icon={<DeleteIcon />}
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => removeItem(item.id)}
                    // isDisabled={items.length === 1}
                  />
                </Flex>

                <Grid templateColumns={{ base: "1fr", md: "2fr 0.7fr 0.7fr 1fr" }} gap={3}>
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Input
                      placeholder="Item / Service description"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(item.id, "description", e.target.value)
                      }
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Qty</Field.Label>
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        handleItemChange(item.id, "qty", e.target.value)
                      }
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>UOM</Field.Label>
                    <Input
                      placeholder="PCS / BOX / KG"
                      value={item.uom}
                      onChange={(e) =>
                        handleItemChange(item.id, "uom", e.target.value)
                      }
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Estimated Price</Field.Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.estPrice}
                      onChange={(e) =>
                        handleItemChange(item.id, "estPrice", e.target.value)
                      }
                    />
                  </Field.Root>
                </Grid>

                <Field.Root mt={3}>
                  <Field.Label>Remarks</Field.Label>
                  <Input
                    placeholder="Optional remarks"
                    value={item.remarks}
                    onChange={(e) =>
                      handleItemChange(item.id, "remarks", e.target.value)
                    }
                  />
                </Field.Root>
              </Box>
            ))}
          </Stack>
        </Card.Body>
      </Card.Root>

      <Separator my={8} />

      <Flex justify="flex-end" gap={3}>
        <Button variant="outline" onClick={() => handleSubmit("draft")}>
          Save Draft
        </Button>
        <Button colorScheme="teal" onClick={() => handleSubmit("submit")}>
          Submit
        </Button>
      </Flex>
    </Container>
  );
}
