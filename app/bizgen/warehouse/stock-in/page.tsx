"use client";

import {Button, Flex, Field, Heading, Input, NumberInput, SimpleGrid, Textarea, Card,} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import Loading from "@/components/loading";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";

export default function CreateStockInPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

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
      return;
    }

    try {
      // TODO: connect to API
      console.log("Submitting stock-in payload:", form);

      router.back();
    } catch (e) {

    }
  };

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading>Add New Stock (Stock In)</Heading>

      <Card.Root mt={5}>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Field.Root>
              <Field.Label>LOT Number</Field.Label>
              <Input placeholder="e.g. LOT-2026-0001" value={form.lotNo} onChange={(e) => handleChange("lotNo", e.target.value)}/>
              <Field.HelperText>Primary identifier for this batch. (You can later switch to UUID/auto-generated if needed)</Field.HelperText>
            </Field.Root>
            <Field.Root >
              <Field.Label>Product Name</Field.Label>
              <Input placeholder="e.g. Green Coffee Beans" value={form.productName} onChange={(e) => handleChange("productName", e.target.value)}/>
            </Field.Root>
            <Field.Root >
              <Field.Label>Quantity</Field.Label>
              <NumberInput.Root>
                <NumberInput.Control/>
                <NumberInput.Input/>
              </NumberInput.Root>
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
              <Input placeholder="e.g. Main Warehouse A" value={form.warehouse} onChange={(e) => handleChange("warehouse", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Bin / Location</Field.Label>
              <Input placeholder="e.g. Rack B-03" value={form.binLocation} onChange={(e) => handleChange("binLocation", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Received Date</Field.Label>
              <Input type="date" value={form.receivedDate} onChange={(e) => handleChange("receivedDate", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Expiry Date (Optional)</Field.Label>
              <Input type="date" value={form.expiryDate} onChange={(e) => handleChange("expiryDate", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Supplier</Field.Label>
              <Input placeholder="Supplier name" value={form.supplier} onChange={(e) => handleChange("supplier", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Reference No. (PO / Inbound)</Field.Label>
              <Input placeholder="Optional reference link to PO / Shipment" value={form.referenceNo} onChange={(e) => handleChange("referenceNo", e.target.value)}/>
            </Field.Root>
          </SimpleGrid>

          <Field.Root>
            <Field.Label>Notes</Field.Label>
            <Textarea rows={4} placeholder="Additional remarks…" value={form.notes} onChange={(e) => handleChange("notes", e.target.value)}/>
          </Field.Root>

          <Flex gap={4} justify="flex-end">
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button colorScheme="teal" onClick={handleSubmit}>Save Stock</Button>
          </Flex>
        </Card.Body>
      </Card.Root>

    </SidebarWithHeader>
    
  );
}
