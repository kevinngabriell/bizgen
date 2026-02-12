"use client";

import React, { useEffect, useState } from "react";
import { Heading, SimpleGrid, Field, Input, Textarea, Button, Flex, Text, Card } from "@chakra-ui/react";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import Loading from "@/components/loading";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { useRouter } from "next/navigation";


export default function CreateStockOutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    
  if (loading) return <Loading/>;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: wire to API
    setTimeout(() => {
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex flexDir={"column"}>
        <Heading mb={1}>Create Stock Out</Heading>
        <Text color="gray.500" fontSize={"sm"}>Record goods leaving warehouse (sales delivery, transfer, sample, damaged, etc.)</Text>
      </Flex>

      <Card.Root mt={5}>
        <Card.Body>
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

          <Field.Root mt={4}>
            <Field.Label>Reason / Notes</Field.Label>
            <Textarea rows={4} placeholder="Describe reason for stock out (optional)" />
          </Field.Root>

          <Flex justify="flex-end" mt={6} gap={6}>
              <Button variant="outline" type="button">Cancel</Button>
            <Button type="submit">Save Stock Out</Button>

          </Flex>
        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
    
  );
}