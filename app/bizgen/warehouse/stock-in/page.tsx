"use client";

import {
  Box,
  Button,
  Flex,
  Field,
  Heading,
  Input,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateStockInPage() {
  const router = useRouter();
//   const toast = useToast();

  const [form, setForm] = useState({
    lotNo: "",
    productName: "",
    quantity: 0,
    unit: "PCS",
    warehouse: "",
    binLocation: "",
    receivedDate: "",
    expiryDate: "",
    supplier: "",
    referenceNo: "",
    notes: "",
  });

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.lotNo || !form.productName || !form.quantity || !form.warehouse) {
    //   toast({
    //     title: "Missing required fields",
    //     description: "LOT No, Product, Quantity, and Warehouse are required.",
    //     status: "warning",
    //   });
      return;
    }

    try {
      // TODO: connect to API
      console.log("Submitting stock-in payload:", form);

    //   toast({
    //     title: "Stock created",
    //     description: "New stock-in record has been saved.",
    //     status: "success",
    //   });

      router.back();
    } catch (e) {
    //   toast({
    //     title: "Failed to save",
    //     description: "Something went wrong. Please try again.",
    //     status: "error",
    //   });
    }
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>
        Add New Stock (Stock In)
      </Heading>

      <Stack gap={6}>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          <Field.Root >
            <Field.Label>LOT Number</Field.Label>
            <Input
              placeholder="e.g. LOT-2026-0001"
              value={form.lotNo}
              onChange={(e) => handleChange("lotNo", e.target.value)}
            />
            <Field.HelperText>
              Primary identifier for this batch. (You can later switch to UUID/auto-generated if needed)
            </Field.HelperText>
          </Field.Root>

          <Field.Root >
            <Field.Label>Product Name</Field.Label>
            <Input
              placeholder="e.g. Green Coffee Beans"
              value={form.productName}
              onChange={(e) => handleChange("productName", e.target.value)}
            />
          </Field.Root>

          <Field.Root >
            <Field.Label>Quantity</Field.Label>
            {/* <NumberInput
              min={0}
              value={form.quantity}
              onChange={(_, v) => handleChange("quantity", v)}
            >
              <NumberInputField placeholder="e.g. 100" />
            </NumberInput> */}
          </Field.Root>

          <Field.Root>
            <Field.Label>Unit</Field.Label>
            {/* <Select
              value={form.unit}
              onChange={(e) => handleChange("unit", e.target.value)}
            >
              <option value="PCS">PCS</option>
              <option value="BOX">BOX</option>
              <option value="KG">KG</option>
              <option value="CARTON">CARTON</option>
            </Select> */}
          </Field.Root>

          <Field.Root >
            <Field.Label>Warehouse</Field.Label>
            <Input
              placeholder="e.g. Main Warehouse A"
              value={form.warehouse}
              onChange={(e) => handleChange("warehouse", e.target.value)}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Bin / Location</Field.Label>
            <Input
              placeholder="e.g. Rack B-03"
              value={form.binLocation}
              onChange={(e) => handleChange("binLocation", e.target.value)}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Received Date</Field.Label>
            <Input
              type="date"
              value={form.receivedDate}
              onChange={(e) => handleChange("receivedDate", e.target.value)}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Expiry Date (Optional)</Field.Label>
            <Input
              type="date"
              value={form.expiryDate}
              onChange={(e) => handleChange("expiryDate", e.target.value)}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Supplier</Field.Label>
            <Input
              placeholder="Supplier name"
              value={form.supplier}
              onChange={(e) => handleChange("supplier", e.target.value)}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Reference No. (PO / Inbound)</Field.Label>
            <Input
              placeholder="Optional reference link to PO / Shipment"
              value={form.referenceNo}
              onChange={(e) => handleChange("referenceNo", e.target.value)}
            />
          </Field.Root>
        </SimpleGrid>

        <Field.Root>
          <Field.Label>Notes</Field.Label>
          <Textarea
            rows={4}
            placeholder="Additional remarks…"
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
          />
        </Field.Root>

        <Flex gap={4} justify="flex-end">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button colorScheme="teal" onClick={handleSubmit}>
            Save Stock
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
