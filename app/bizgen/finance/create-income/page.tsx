'use client';

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  Separator,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateIncomePage() {
  const router = useRouter();
//   const toast = useToast();

  // Example account code options — later connect to API / master data
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
    //   toast({
    //     title: 'Missing required fields',
    //     description: 'Account Code, Amount, and Date are required.',
    //     status: 'warning',
    //   });
      return;
    }

    // TODO: connect to API
    console.log('Submitting income payload:', form);

    // toast({
    //   title: 'Income saved',
    //   description: 'Income transaction has been created.',
    //   status: 'success',
    // });

    router.back();
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Create Income</Heading>
          <Text color="gray.500" mt={1}>
            Record incoming company revenue with account code mapping.
          </Text>
        </Box>

        <HStack gap={3}>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button colorScheme="green" onClick={handleSubmit}>
            Save Income
          </Button>
        </HStack>
      </Flex>

      <Box borderWidth="1px" borderRadius="lg" p={5} bg="white">
        <Stack gap={5}>
          <Box>
            <Text fontWeight="medium" mb={2}>
              Account Code *
            </Text>
            {/* <Select
              placeholder="Select account code"
              value={form.accountCode}
              onChange={e => onChange('accountCode', e.target.value)}
            >
              {accountCodes.map(acc => (
                <option key={acc.code} value={acc.code}>
                  {acc.code} — {acc.name}
                </option>
              ))}
            </Select> */}
            <Text fontSize="sm" color="gray.500" mt={1}>
              Determines how this income is categorized in your chart of accounts.
            </Text>
          </Box>

          <Flex gap={4} flexDir={{ base: 'column', md: 'row' }}>
            <Box flex="1">
              <Text fontWeight="medium" mb={2}>
                Income Date *
              </Text>
              <Input
                type="date"
                value={form.incomeDate}
                onChange={e => onChange('incomeDate', e.target.value)}
              />
            </Box>

            <Box flex="1">
              <Text fontWeight="medium" mb={2}>
                Amount *
              </Text>
              <Input
                type="number"
                placeholder="0"
                value={form.amount}
                onChange={e => onChange('amount', e.target.value)}
              />
            </Box>

            <Box w={{ base: '100%', md: '180px' }}>
              <Text fontWeight="medium" mb={2}>
                Currency
              </Text>
              {/* <Select
                value={form.currency}
                onChange={e => onChange('currency', e.target.value)}
              >
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
                <option value="EUR">EUR</option>
              </Select> */}
            </Box>
          </Flex>

          <Separator />

          <Flex gap={4} flexDir={{ base: 'column', md: 'row' }}>
            <Box flex="1">
              <Text fontWeight="medium" mb={2}>
                Customer / Payer (optional)
              </Text>
              <Input
                placeholder="Enter customer or payer name"
                value={form.customer}
                onChange={e => onChange('customer', e.target.value)}
              />
            </Box>

            <Box flex="1">
              <Text fontWeight="medium" mb={2}>
                Reference No. (optional)
              </Text>
              <Input
                placeholder="Invoice / Receipt reference"
                value={form.referenceNo}
                onChange={e => onChange('referenceNo', e.target.value)}
              />
            </Box>
          </Flex>

          <Box>
            <Text fontWeight="medium" mb={2}>
              Description / Notes
            </Text>
            <Textarea
              rows={3}
              placeholder="Add additional details (e.g., payment source, remarks)"
              value={form.description}
              onChange={e => onChange('description', e.target.value)}
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
