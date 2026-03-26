"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { Button, Flex, Heading, IconButton, Input, Text, Textarea, Field, Card, SimpleGrid} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

type RequisitionItem = {
  id: string;
  description: string;
  qty: string;
  uom: string;
  estPrice: string;
  remarks: string;
};

export default function PurchaseRequisitionCreatePage() {
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
  };
  
  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between" align="center" mb={6}>
        <Flex flexDir={"column"}>
          <Heading size="lg">Create Purchase Requisition</Heading>
          <Text color="gray.500" fontSize={"sm"}>Raise a request for purchasing goods / services.</Text>
        </Flex>

        <Flex gap={4}>
          <Button variant="outline" onClick={() => handleSubmit("draft")}>Save Draft</Button>
          <Button colorScheme="teal" onClick={() => handleSubmit("submit")}>Submit</Button>
        </Flex>
      </Flex>

      <Card.Root mb={6}>
        <Card.Header>
          <Heading size="md">Requisition Details</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{base: 1, md: 2}} gap={4}>
            <Field.Root>
              <Field.Label>PR Number</Field.Label>
              <Input placeholder="Auto / Manual" value={form.prNumber} onChange={(e) => setForm({ ...form, prNumber: e.target.value })}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>PR Date</Field.Label>
              <Input type="date" value={form.prDate} onChange={(e) => setForm({ ...form, prDate: e.target.value })}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Requester</Field.Label>
              <Input placeholder="Requester name" value={form.requester} onChange={(e) => setForm({ ...form, requester: e.target.value })}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Department</Field.Label>
              <Input placeholder="Department / Division" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Preferred Vendor (Optional)</Field.Label>
              <Input placeholder="Vendor name" value={form.vendorPreference} onChange={(e) => setForm({ ...form, vendorPreference: e.target.value })}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Currency</Field.Label>
              {/* Harusnya ada selection area */}
            </Field.Root>
          </SimpleGrid> 

          <Field.Root mt={4}>
            <Field.Label>Notes</Field.Label>
            <Textarea rows={3} placeholder="Additional instructions or justifications" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}/>
          </Field.Root>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">Requested Items</Heading>
            <Button size="sm" onClick={addItem} variant="outline">Add Item</Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          {items.map((item, idx) => (
            <Card.Root key={item.id} p={3} mb={2}>
              <Card.Body>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontWeight="semibold">Item #{idx + 1}</Text>
                  <IconButton aria-label="Remove item" size="sm" variant="ghost" color="red" onClick={() => removeItem(item.id)}>
                    <FaTrash/>
                  </IconButton>
                </Flex>

                <SimpleGrid templateColumns={{ base: "1fr", md: "2fr 0.7fr 0.7fr 1fr" }} gap={3}>
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Input placeholder="Item / Service description" value={item.description} onChange={(e) => handleItemChange(item.id, "description", e.target.value)}/>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Qty</Field.Label>
                    <Input type="number" value={item.qty} onChange={(e) => handleItemChange(item.id, "qty", e.target.value)}/>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>UOM</Field.Label>
                    <Input placeholder="PCS / BOX / KG" value={item.uom} onChange={(e) => handleItemChange(item.id, "uom", e.target.value)}/>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Estimated Price</Field.Label>
                    <Input type="number" placeholder="0" value={item.estPrice} onChange={(e) => handleItemChange(item.id, "estPrice", e.target.value)}/>
                  </Field.Root>
                </SimpleGrid>
                
                <Field.Root mt={3}>
                  <Field.Label>Remarks</Field.Label>
                  <Input placeholder="Optional remarks" value={item.remarks} onChange={(e) => handleItemChange(item.id, "remarks", e.target.value)}/>
                </Field.Root>

              </Card.Body>
            </Card.Root>
          ))}
        </Card.Body>
      </Card.Root>

      <Flex justify="flex-end" gap={3} mt={6}>
        <Button variant="outline" onClick={() => handleSubmit("draft")}>
          Save Draft
        </Button>
        <Button colorScheme="teal" onClick={() => handleSubmit("submit")}>
          Submit
        </Button>
      </Flex>
      
    </SidebarWithHeader>
    
  );
}
