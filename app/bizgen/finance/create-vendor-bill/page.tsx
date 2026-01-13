"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, Card, Separator, Flex, Field, IconButton, Input, NumberInput, Text, Textarea, Heading, SimpleGrid,} from "@chakra-ui/react";
import { useState } from "react";
import { FaTrash } from "react-icons/fa";

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  tax: number;
}

export default function CreateVendorBillPage() {
  const [vendor, setVendor] = useState("");
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", qty: 1, unitPrice: 0, tax: 0 },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", qty: 1, unitPrice: 0, tax: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const subtotal = items.reduce(
    (sum, i) => sum + i.qty * i.unitPrice,
    0
  );

  const taxTotal = items.reduce(
    (sum, i) => sum + (i.qty * i.unitPrice * (i.tax || 0)) / 100,
    0
  );

  const grandTotal = subtotal + taxTotal;

  const handleSave = (mode: "draft" | "post") => {

  };

  return (
    <SidebarWithHeader username="---">
      <Heading>Create Vendor Bill</Heading>

      <Card.Root mt={4}>
        <Card.Body>
          <SimpleGrid columns={{base: 1, md: 2}} gap={8}>
            <Field.Root>
              <Field.Label>Vendor</Field.Label>
              {/* <Select
                    placeholder="Select vendor"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                  >
                    <option value="vendor-1">Vendor A</option>
                    <option value="vendor-2">Vendor B</option>
                  </Select> */}
            </Field.Root>

            <Field.Root>
              <Field.Label>Reference (PO / GR / Job)</Field.Label>
              <Input placeholder="Optional reference" value={reference} onChange={(e) => setReference(e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Bill No.</Field.Label>
              <Input value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="Invoice number from vendor"/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Bill Date</Field.Label>
              <Input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Due Date</Field.Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Currency</Field.Label>
              <Flex>
                {/* Select Currency */}
                <NumberInput.Root>
                  <NumberInput.Control/>
                  <NumberInput.Input/>
                </NumberInput.Root>
              </Flex>
            </Field.Root>
          </SimpleGrid>

          <Heading fontSize={"md"} mt={6} mb={2}>Line Items</Heading>

          {items.map((item) => (
            <Card.Root key={item.id} variant="outline" mt={3}>
              <Card.Body>
                <SimpleGrid templateColumns={{base: "1fr", md: "2fr 1fr 1fr 1fr auto",}} gap={3} alignItems="center">
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Item / service description"/>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Qty</Field.Label>
                    <NumberInput.Root>
                      <NumberInput.Control/>
                      <NumberInput.Input/>
                    </NumberInput.Root>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Unit Price</Field.Label>
                    <NumberInput.Root>
                      <NumberInput.Control/>
                      <NumberInput.Input/>
                    </NumberInput.Root>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Tax %</Field.Label>
                    <NumberInput.Root>
                      <NumberInput.Control/>
                      <NumberInput.Input/>
                    </NumberInput.Root>
                  </Field.Root>

                  <IconButton aria-label="Remove row" variant="ghost" color={"red"} onClick={() => removeItem(item.id)}>
                    <FaTrash/>
                  </IconButton>
                </SimpleGrid>
              </Card.Body>
            </Card.Root>
          ))}

          <Button mt={4} variant="outline" onClick={addItem} alignSelf="flex-start">Add Line Item</Button>

          <SimpleGrid templateColumns={{ base: "1fr", md: "1fr 300px" }} gap={6} mt={6}>
            <Field.Root>
              <Field.Label>Notes</Field.Label>
              <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for internal / finance"/>
            </Field.Root>
            <Card.Root variant="outline">
              <Card.Body>
                <Flex flexDir={"column"}>
                  <Flex justify={"space-between"} mb={3}>
                    <Text color="gray.600" fontSize={"sm"}>Subtotal</Text>
                    <Text fontWeight="semibold" fontSize={"sm"}> {subtotal.toLocaleString()}</Text>
                  </Flex>
                  <Flex justify={"space-between"} mb={3}>
                    <Text color="gray.600" fontSize={"sm"}>Tax</Text>
                    <Text fontWeight="semibold" fontSize={"sm"}>{taxTotal.toLocaleString()}</Text>
                  </Flex>
                  <Separator mb={3}/>
                  <Flex justify={"space-between"}>
                    <Text fontWeight="bold" fontSize={"sm"}>Grand Total</Text>
                    <Text fontWeight="bold" fontSize={"sm"}>{grandTotal.toLocaleString()}</Text>
                  </Flex>
                </Flex>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          <Flex justify="space-between" mt={5}>
            <Button variant="outline" onClick={() => handleSave("draft")}>Save as Draft</Button>
            <Button colorScheme="blue" onClick={() => handleSave("post")}>Post Vendor Bill</Button>
          </Flex>
        </Card.Body>
      </Card.Root>

    </SidebarWithHeader>
    
  );
}
