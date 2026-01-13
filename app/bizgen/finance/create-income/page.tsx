'use client';

import {Button, Flex, Heading, Input, Text, Textarea, Separator, Card, SimpleGrid, Field} from '@chakra-ui/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';

export default function CreateIncomePage() {
  const router = useRouter();

  const accountCodes = [
    { code: '4001', name: 'Sales Revenue' },
    { code: '4002', name: 'Service Income' },
    { code: '4101', name: 'Other Operating Income' },
    { code: '4200', name: 'Non‑Operating Income' },
  ];

  const [form, setForm] = useState({
    accountCode: '',
    incomeDate: '',
    amount: '',
    currency: 'IDR',
    description: '',
    referenceNo: '',
    customer: '',
  });

  const onChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.accountCode || !form.amount || !form.incomeDate) {
      return;
    }

    // TODO: connect to API
    console.log('Submitting income payload:', form);

    router.back();
  };

  return (
    <SidebarWithHeader username='---'>
      <Flex justify="space-between" align="center" mb={6}>
        <Flex flexDir={"column"}>
          <Heading size="lg">Create Income</Heading>
          <Text color="gray.500" mt={1}>Record incoming company revenue with account code mapping.</Text>
        </Flex>

        <Flex gap={5}>
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button colorScheme="green" onClick={handleSubmit}>Save Income</Button>
        </Flex>
      </Flex>

      <Card.Root>
        <Card.Body gap={"20px"}>
          <Field.Root required>
            <Field.Label>Account Code</Field.Label>
            <Field.HelperText>Determines how this income is categorized in your chart of accounts.</Field.HelperText>
          </Field.Root>
          <SimpleGrid columns={{base: 1, md: 2, lg:3}} gap={"20px"}>
            <Field.Root required>
              <Field.Label>Income Date</Field.Label>
              <Input type="date" value={form.incomeDate} onChange={e => onChange('incomeDate', e.target.value)}/>
            </Field.Root>
            <Field.Root required>
              <Field.Label>Amount</Field.Label>
              <Input type="number" placeholder="0" value={form.amount} onChange={e => onChange('amount', e.target.value)}/>
            </Field.Root>
            <Field.Root required>
              <Field.Label>Currency</Field.Label>
              {/* <Select
                value={form.currency}
                onChange={e => onChange('currency', e.target.value)}
              >
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
                <option value="EUR">EUR</option>
              </Select> */}
            </Field.Root>
          </SimpleGrid>
          <Separator/>
          <SimpleGrid columns={{base: 1, md: 2}} gap={"20px"}>
            <Field.Root>
              <Field.Label>Customer / Payer (optional)</Field.Label>
              <Input placeholder="Enter customer or payer name" value={form.customer}onChange={e => onChange('customer', e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Reference No. (optional)</Field.Label>
              <Input placeholder="Invoice / Receipt reference" value={form.referenceNo} onChange={e => onChange('referenceNo', e.target.value)}/>
            </Field.Root>
          </SimpleGrid>

          <Field.Root>
            <Field.Label>Description / Notes</Field.Label>
            <Textarea rows={3} placeholder="Add additional details (e.g., payment source, remarks)" value={form.description} onChange={e => onChange('description', e.target.value)}/>
          </Field.Root>
        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
    
  );
}
