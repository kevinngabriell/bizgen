

"use client";

import {
  Box,
  Button,
  Card,
  Flex,
  Field,
  HStack,
  Heading,
  Input,
  NumberInput,
  Select,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";

export default function CreateSampleStockOutPage() {
//   const toast = useToast();

  const [form, setForm] = useState({
    referenceNo: "",
    lotNo: "",
    productName: "",
    qty: 1,
    unit: "PCS",
    requestedBy: "",
    purpose: "",
    notes: "",
  });

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // TODO: connect to API later
    // toast({
    //   title: "Sample stock-out recorded",
    //   description:
    //     "Sample item has been deducted from warehouse stock successfully.",
    //   status: "success",
    // });
  };

  return (
    <Flex justify="center" px={{ base: 4, md: 8 }} py={6}>
      <Card.Root maxW="960px" w="100%">
        <Card.Header>
          <Heading size="md">Create Stock Out — Sample</Heading>
        </Card.Header>

        <Card.Body>
          <Stack gap={6}>
            <HStack gap={4}>
              <Field.Root>
                <Field.Label>Reference No</Field.Label>
                <Input
                  placeholder="Auto / Optional"
                  value={form.referenceNo}
                  onChange={(e) =>
                    handleChange("referenceNo", e.target.value)
                  }
                />
              </Field.Root>

              <Field.Root >
                <Field.Label>LOT / Batch No</Field.Label>
                <Input
                  placeholder="LOT-2026-001"
                  value={form.lotNo}
                  onChange={(e) => handleChange("lotNo", e.target.value)}
                />
              </Field.Root>
            </HStack>

            <Field.Root >
              <Field.Label>Product Name</Field.Label>
              <Input
                placeholder="Type / select product"
                value={form.productName}
                onChange={(e) => handleChange("productName", e.target.value)}
              />
            </Field.Root>

            <HStack gap={4}>
              <Field.Root >
                <Field.Label>Quantity</Field.Label>
                {/* <NumberInput
                  min={1}
                  value={form.qty}
                  onChange={(_, v) => handleChange("qty", v)}
                >
                  <NumberInputField />
                </NumberInput> */}
              </Field.Root>

              <Field.Root >
                <Field.Label>Unit</Field.Label>
                {/* <Select
                  value={form.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                >
                  <option value="PCS">PCS</option>
                  <option value="BOX">BOX</option>
                  <option value="PACK">PACK</option>
                </Select> */}
              </Field.Root>
            </HStack>

            <HStack gap={4}>
              <Field.Root >
                <Field.Label>Requested By</Field.Label>
                <Input
                  placeholder="Staff / Department"
                  value={form.requestedBy}
                  onChange={(e) => handleChange("requestedBy", e.target.value)}
                />
              </Field.Root>

              <Field.Root >
                <Field.Label>Purpose of Sample</Field.Label>
                {/* <Select
                  placeholder="Select purpose"
                  value={form.purpose}
                  onChange={(e) => handleChange("purpose", e.target.value)}
                >
                  <option value="marketing">Marketing / Demo</option>
                  <option value="qc-test">QC Test</option>
                  <option value="customer-evaluation">
                    Customer Evaluation
                  </option>
                  <option value="internal-use">Internal Use</option>
                </Select> */}
              </Field.Root>
            </HStack>

            <Field.Root>
              <Field.Label>Notes</Field.Label>
              <Textarea
                placeholder="Additional remarks (optional)"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </Field.Root>

            <Flex justify="flex-end" gap={3}>
              <Button variant="outline">Cancel</Button>
              <Button colorScheme="teal" onClick={handleSubmit}>
                Save Sample Stock Out
              </Button>
            </Flex>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Flex>
  );
}