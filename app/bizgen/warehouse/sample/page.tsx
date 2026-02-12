"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import {Button, Card, Flex, Field, Heading, Input, NumberInput, Textarea, SimpleGrid} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

export default function CreateSampleStockOutPage() {
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
  };

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Card.Root>
        <Card.Header>
          <Heading size="md">Create Stock Out — Sample</Heading>
        </Card.Header>

        <Card.Body>
          <SimpleGrid columns={{base: 1, md: 2}} gap={5}>
            <Field.Root>
              <Field.Label>Reference No</Field.Label>
              <Input placeholder="Auto / Optional" value={form.referenceNo} onChange={(e) => handleChange("referenceNo", e.target.value)}/>
            </Field.Root>

            <Field.Root >
              <Field.Label>LOT / Batch No</Field.Label>
              <Input placeholder="LOT-2026-001" value={form.lotNo} onChange={(e) => handleChange("lotNo", e.target.value)}/>
            </Field.Root>
          </SimpleGrid>

          <Field.Root mt={4}>
            <Field.Label>Product Name</Field.Label>
            <Input placeholder="Type / select product" value={form.productName} onChange={(e) => handleChange("productName", e.target.value)}/>
          </Field.Root>

          <SimpleGrid columns={{base: 1, md: 2}} gap={5} mt={4}>
            <Field.Root>
              <Field.Label>Quantity</Field.Label>
              <NumberInput.Root>
                <NumberInput.Control/>
                <NumberInput.Input/>
              </NumberInput.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>Unit</Field.Label>
              {/* Select */}
            </Field.Root>
            <Field.Root>
              <Field.Label>Requested By</Field.Label>
              <Input placeholder="Staff / Department" value={form.requestedBy} onChange={(e) => handleChange("requestedBy", e.target.value)}/>
            </Field.Root>
            <Field.Root >
              <Field.Label>Purpose of Sample</Field.Label>
              {/* select */}
            </Field.Root>
          </SimpleGrid>

          <Field.Root mt={4}>
            <Field.Label>Notes</Field.Label>
            <Textarea placeholder="Additional remarks (optional)" value={form.notes} onChange={(e) => handleChange("notes", e.target.value)}/>
          </Field.Root>

          <Flex justify="flex-end" gap={3} mt={5}>
            <Button variant="outline">Cancel</Button>
            <Button colorScheme="teal" onClick={handleSubmit}>Save Sample Stock Out</Button>
          </Flex>
        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
  );
}