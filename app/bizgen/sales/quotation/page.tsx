"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import {Box, Button, Flex, Heading, HStack, Input, Select, SimpleGrid, Stack, Text, Textarea, Badge, IconButton, Separator, Card, Field,} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

interface QuotationItem {
  id: string;
  product: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export default function CreateQuotation() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    const info = getAuthInfo();
    setAuth(info);

    try {

    } catch (error: any){

    } finally {
      setLoading(false);
    }
  }
    
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
  
  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading size="lg" mb={4}>Create Quotation</Heading>

      <Card.Root gap={6}>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={9}>
            <Stack>
              <Text fontWeight="semibold" mb={3}>Customer Information</Text>
              <Field.Root>
                <Field.Label>Customer Name</Field.Label>
                <Input placeholder="Customer Name" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Company Name</Field.Label>
                <Input placeholder="Company Name" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Email / Whatsapp</Field.Label>
                <Input placeholder="Email / WhatsApp" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Customer Address</Field.Label>
                <Textarea placeholder="Customer Address" />
              </Field.Root>
            </Stack>

            <Stack>
              <Text fontWeight="semibold" mb={3}>Quotation Details</Text>
              <Field.Root>
                <Field.Label>Quotation No</Field.Label>
                <Input placeholder="Quotation No (auto / optional)" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Quotation Date</Field.Label>
                <Input type="date" placeholder="Quotation Date" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Currency</Field.Label>
              </Field.Root>
              <Field.Root>
                <Field.Label>Linked Inquiry (optional)</Field.Label>
              </Field.Root>
            </Stack>
          </SimpleGrid>

          <Separator mt={7} mb={4}/>

          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="semibold">Quotation Items</Text>
            <Button size="sm" bg="#E77A1F" color="white"  onClick={addItem}>Add Item</Button>
          </Flex>

          {items.map((item) => (
            <Card.Root key={item.id} p={4} mb={2}>
              <SimpleGrid columns={{ base: 1, md: 4 }} gap={3}>
                <Input placeholder="Product / Service" />
                <Input placeholder="Description" />
                <Input type="number" placeholder="Qty" />
                <Input type="number" placeholder="Unit Price" />
              </SimpleGrid>

              <HStack justify="space-between" mt={3}>
                <Badge colorScheme="purple">Subtotal auto-calculated later</Badge>
                <IconButton aria-label="Remove item" size="sm" variant="ghost" onClick={() => removeItem(item.id)}>
                  <FaTrash/>
                </IconButton>
              </HStack>
            </Card.Root>
          ))}

          <Separator mt={6} mb={6} />

          <Flex justify="flex-end" gap={3}>
            <Button variant="outline">Cancel</Button>
            <Button bg="#E77A1F" color="white" >Save Draft</Button>
            <Button bg="#E77A1F" color="white" >Save & Generate PDF</Button>
          </Flex>
        </Card.Body>
      </Card.Root>

    </SidebarWithHeader>
  );
}