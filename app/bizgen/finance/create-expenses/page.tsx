

"use client";

import { Box,
  Button,
  Card,
  Separator,
  Flex,
  Field,
  HStack,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";

export default function CreateExpensePage() {
//   const toast = useToast();
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
    // TODO: integrate with API
    // toast({
    //   title: "Expense saved",
    //   description: "Your expense has been recorded.",
    //   status: "success",
    //   duration: 2500,
    //   isClosable: true,
    // });
  };

  return (
    <Flex direction="column" gap={6}>
      <Box>
        <Text fontSize="2xl" fontWeight="bold">
          Create Expense
        </Text>
        <Text fontSize="sm" color="gray.500">
          Record an operational expense and map it to an account code.
        </Text>
      </Box>

      <Card.Root>
        <Card.Header pb={0}>
          <Text fontWeight="semibold">Expense Details</Text>
        </Card.Header>
        <Card.Body>
          <Stack gap={5}>
            <HStack>
              <Field.Root>
                <Field.Label>Date</Field.Label>
                <Input
                  type="date"
                  name="expenseDate"
                  value={form.expenseDate}
                  onChange={handleChange}
                />
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
            </HStack>

            <HStack>
              <Field.Root>
                <Field.Label>Amount</Field.Label>
                <Input
                  type="number"
                  name="amount"
                  placeholder="0"
                  value={form.amount}
                  onChange={handleChange}
                />
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
            </HStack>

            <HStack>
              <Field.Root>
                <Field.Label>Vendor / Payee</Field.Label>
                <Input
                  name="vendor"
                  placeholder="Vendor name"
                  value={form.vendor}
                  onChange={handleChange}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Reference No.</Field.Label>
                <Input
                  name="referenceNo"
                  placeholder="Invoice / Receipt No."
                  value={form.referenceNo}
                  onChange={handleChange}
                />
              </Field.Root>
            </HStack>

            <Field.Root>
              <Field.Label>Description / Notes</Field.Label>
              <Textarea
                name="description"
                placeholder="Additional details about this expense"
                value={form.description}
                onChange={handleChange}
              />
            </Field.Root>

            <Separator />

            <HStack justify="flex-end">
              <Button variant="ghost">Cancel</Button>
              <Button colorScheme="purple" onClick={handleSubmit}>
                Save Expense
              </Button>
            </HStack>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Flex>
  );
}