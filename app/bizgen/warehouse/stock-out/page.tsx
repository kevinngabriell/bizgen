

"use client";

import React, { useState } from "react";
import {
  Box,
  Heading,
  Stack,
  SimpleGrid,
  Field,
  Input,
  Select,
  Textarea,
  Button,
  HStack,
  Separator,
} from "@chakra-ui/react";

export default function CreateStockOutPage() {
//   const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: wire to API
    setTimeout(() => {
      setIsSubmitting(false);
    //   toast({
    //     title: "Stock Out recorded",
    //     description: "The stock out transaction has been saved.",
    //     status: "success",
    //   });
    }, 800);
  };

  return (
    <Box px={{ base: 4, md: 8 }} py={6}>
      <Heading size="lg" mb={2}>
        Create Stock Out
      </Heading>
      <Box color="gray.500" mb={6}>
        Record goods leaving warehouse (sales delivery, transfer, sample, damaged, etc.)
      </Box>

      <Box
        as="form"
        onSubmit={handleSubmit}
        borderWidth="1px"
        borderRadius="lg"
        p={{ base: 4, md: 6 }}
        bg="white"
      >
        <Stack gap={6}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Field.Root >
              <Field.Label>Stock Out Type</Field.Label>
              {/* <Select placeholder="Select type">
                <option value="delivery">Delivery / Sales</option>
                <option value="transfer">Warehouse Transfer Out</option>
                <option value="sample">Sample Out</option>
                <option value="damage">Damaged / Disposal</option>
                <option value="adjustment">Adjustment Out</option>
              </Select> */}
            </Field.Root>

            <Field.Root>
              <Field.Label>Reference No. (SO / DO / Job)</Field.Label>
              <Input placeholder="Optional reference number" />
            </Field.Root>

            <Field.Root >
              <Field.Label>LOT / Batch Number</Field.Label>
              <Input placeholder="Enter LOT number" />
            </Field.Root>

            <Field.Root >
              <Field.Label>Product</Field.Label>
              <Input placeholder="Search / select product" />
            </Field.Root>

            <Field.Root >
              <Field.Label>Warehouse Location</Field.Label>
              <Input placeholder="Warehouse / Rack / Bin" />
            </Field.Root>

            <Field.Root >
              <Field.Label>Quantity Out</Field.Label>
              <Input type="number" min="1" placeholder="0" />
            </Field.Root>

            <Field.Root>
              <Field.Label>UOM</Field.Label>
              <Input placeholder="pcs / box / carton" />
            </Field.Root>

            <Field.Root >
              <Field.Label>Stock Out Date</Field.Label>
              <Input type="date" />
            </Field.Root>
          </SimpleGrid>

          <Separator />

          <Field.Root>
            <Field.Label>Reason / Notes</Field.Label>
            <Textarea rows={4} placeholder="Describe reason for stock out (optional)" />
          </Field.Root>

          <HStack justify="flex-end" gap={3}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
            //   isLoading={isSubmitting}
            >
              Save Stock Out
            </Button>
          </HStack>
        </Stack>
      </Box>
    </Box>
  );
}