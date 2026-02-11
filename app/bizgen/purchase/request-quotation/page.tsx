"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { Box, Button, Card, Separator, Flex, Field, Grid, GridItem, HStack, IconButton, Input, Select, Stack, Text, Textarea, Heading, SimpleGrid } from "@chakra-ui/react";
import { useRouter } from "next/router";
// import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

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

  };

  return (
    <SidebarWithHeader username="---">
        <Flex justify="space-between" align="center" mb={4}>
          <Heading>Create Request Quotation</Heading>
          <Flex gap={6}>
            <Button variant="outline" onClick={handleSubmit}>Save as Draft</Button>
            <Button colorScheme="blue" onClick={handleSubmit}>Submit Request</Button>
          </Flex>
        </Flex>

        <Card.Root mb={6}>
          <Card.Header>
            <Heading fontWeight="semibold">Request Details</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
              <Field.Root>
                <Field.Label>Inquiry Reference (optional)</Field.Label>
                <Input placeholder="Select or input inquiry reference" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Customer / Buyer</Field.Label>
                <Input placeholder="Customer name" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Contact Person</Field.Label>
                <Input placeholder="Contact person name" />
              </Field.Root>
              <Field.Root>
                <Field.Label>WhatsApp / Phone</Field.Label>
                <Input placeholder="+62…" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Shipment Type</Field.Label>
              </Field.Root>
              <Field.Root>
                <Field.Label>Service Type</Field.Label>
              </Field.Root>
              <Field.Root>
                <Field.Label>Origin</Field.Label>
                <Input placeholder="City / Port of loading" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Destination</Field.Label>
                <Input placeholder="City / Port of discharge" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Additional Notes</Field.Label>
                <Textarea placeholder="Add shipment context, special handling, etc." />
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        <Card.Root mb={6}>
          <Card.Header>
            <Flex justify={"space-between"}>
              <Heading>Goods / Item Details</Heading>
              <Button size="sm" onClick={addItem}>Add Item</Button>
            </Flex>
          </Card.Header>
          <Card.Body>
            {items.map((item, index) => (
              <Card.Root key={item.id} p={2} mb={2}>
                <Card.Body>
                  <Flex justify="space-between" mb={2}>
                    <Text fontWeight="medium">Item {index + 1}</Text>
                    <IconButton aria-label="Remove item" size="sm" variant="ghost" color="red" onClick={() => removeItem(item.id)}>
                      <FaTrash/>
                    </IconButton>
                  </Flex>

                  <SimpleGrid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
                    <Field.Root>
                      <Field.Label>Description</Field.Label>
                      <Input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Product description"/>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>HS Code</Field.Label>
                      <Input value={item.hsCode} onChange={(e) => updateItem(item.id, "hsCode", e.target.value)}placeholder="e.g. 09012120"/>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Currency</Field.Label>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Quantity</Field.Label>
                      <Input value={item.qty} onChange={(e) => updateItem(item.id, "qty", e.target.value)} placeholder="0"/>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>UOM</Field.Label>
                      <Input value={item.uom} onChange={(e) => updateItem(item.id, "uom", e.target.value)} placeholder="CTN / KG / PCS"/>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Unit Price</Field.Label>
                      <Input value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)} placeholder="0.00"/>
                    </Field.Root>

                  </SimpleGrid>
                </Card.Body>
              </Card.Root>
            ))}
          </Card.Body>
        </Card.Root>

        <Flex justify="flex-end" gap={6}>
          <Button variant="outline" onClick={handleSubmit}>Save as Draft</Button>
          <Button colorScheme="blue" onClick={handleSubmit}>Submit Request</Button>
        </Flex>
    </SidebarWithHeader>
    
  );
}