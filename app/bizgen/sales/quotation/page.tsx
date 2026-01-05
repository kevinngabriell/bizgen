"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Badge,
  IconButton,
  Separator,
} from "@chakra-ui/react";
import { useState } from "react";

interface QuotationItem {
  id: string;
  product: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export default function CreateQuotation() {
  const [items, setItems] = useState<QuotationItem[]>([
    { id: crypto.randomUUID(), product: "", description: "", qty: 1, unitPrice: 0 },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), product: "", description: "", qty: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <SidebarWithHeader username="-">
      <Flex direction="column" p={6} gap={6}>
        <Heading size="lg">Create Quotation</Heading>

        {/* Customer & Quotation Meta */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          <Stack>
            <Text fontWeight="semibold">Customer Information</Text>
            <Input placeholder="Customer Name" />
            <Input placeholder="Company Name" />
            <Input placeholder="Email / WhatsApp" />
            <Textarea placeholder="Customer Address" />
          </Stack>

          <Stack>
            <Text fontWeight="semibold">Quotation Details</Text>
            <Input placeholder="Quotation No (auto / optional)" />
            <Input type="date" placeholder="Quotation Date" />
            {/* <Select placeholder="Currency">
              <option value="usd">USD</option>
              <option value="idr">IDR</option>
            </Select>
            <Select placeholder="Linked Inquiry (optional)">
              <option value="inq-001">INQ-001</option>
            </Select> */}
          </Stack>
        </SimpleGrid>

        <Separator />

        {/* Items Section */}
        <Flex justify="space-between" align="center">
          <Text fontWeight="semibold">Quotation Items</Text>
          <Button  size="sm" onClick={addItem}>
            Add Item
          </Button>
        </Flex>

        <Stack gap={4}>
          {items.map((item) => (
            <Box
              key={item.id}
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              bg="white"
            >
              <SimpleGrid columns={{ base: 1, md: 4 }} gap={3}>
                <Input placeholder="Product / Service" />
                <Input placeholder="Description" />
                <Input type="number" placeholder="Qty" />
                <Input type="number" placeholder="Unit Price" />
              </SimpleGrid>

              <HStack justify="space-between" mt={3}>
                <Badge colorScheme="purple">
                  Subtotal auto-calculated later
                </Badge>
                <IconButton
                  aria-label="Remove item"
                  
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItem(item.id)}
                />
              </HStack>
            </Box>
          ))}
        </Stack>

        <Separator />

        {/* Footer Actions */}
        <Flex justify="flex-end" gap={3}>
          <Button variant="outline">Cancel</Button>
          <Button colorScheme="purple">Save Draft</Button>
          <Button colorScheme="green">Save & Generate PDF</Button>
        </Flex>
      </Flex>
    </SidebarWithHeader>
  );
}