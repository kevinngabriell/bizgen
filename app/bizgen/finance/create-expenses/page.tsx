"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, Card, Flex, Field, Input, Text, Textarea, Heading, SimpleGrid } from "@chakra-ui/react";
import { useState } from "react";

export default function CreateExpensePage() {
  const [form, setForm] = useState({
    expenseDate: "",
    accountCode: "",
    amount: "",
    currency: "IDR",
    vendor: "",
    referenceNo: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {

  };

  return (
    <SidebarWithHeader username="---">
      <Flex flexDir={"column"}>
        <Heading>Create Expense</Heading>
        <Text fontSize="sm" color="gray.500">Record an operational expense and map it to an account code.</Text>
      </Flex>

      <Card.Root mt={6}>
        <Card.Header pb={0}>
           <Text fontWeight="semibold">Expense Details</Text>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{base: 1, md: 2}} gap={"20px"}>
            <Field.Root>
              <Field.Label>Date</Field.Label>
              <Input type="date" name="expenseDate" value={form.expenseDate} onChange={handleChange}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Account Code</Field.Label>
              {/* <Select
                  placeholder="Select account code"
                  name="accountCode"
                  value={form.accountCode}
                  onChange={handleChange}
                >
                  <option value="5001">5001 — Office Supplies</option>
                  <option value="5002">5002 — Transportation</option>
                  <option value="5003">5003 — Warehouse & Handling</option>
                  <option value="5004">5004 — Freight / Logistics Cost</option>
                  <option value="5099">5099 — Other Operational Expense</option>
                </Select> */}
            </Field.Root>
            <Field.Root>
              <Field.Label>Amount</Field.Label>
              <Input type="number" name="amount" placeholder="0" value={form.amount} onChange={handleChange}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Currency</Field.Label>
              {/* <Select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                >
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                </Select> */}
            </Field.Root>
            <Field.Root>
              <Field.Label>Vendor / Payee</Field.Label>
              <Input name="vendor" placeholder="Vendor name" value={form.vendor} onChange={handleChange}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Reference No.</Field.Label>
              <Input name="referenceNo" placeholder="Invoice / Receipt No." value={form.referenceNo} onChange={handleChange}/>
            </Field.Root>
          </SimpleGrid>

          <Field.Root mt={5}>
            <Field.Label>Description / Notes</Field.Label>
            <Textarea name="description" placeholder="Additional details about this expense" value={form.description} onChange={handleChange}/>
          </Field.Root>

          <Flex justify="flex-end" mt={5}>
            <Button variant="ghost">Cancel</Button>
            <Button colorScheme="purple" onClick={handleSubmit}>Save Expense</Button>
          </Flex>
        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
  );
}