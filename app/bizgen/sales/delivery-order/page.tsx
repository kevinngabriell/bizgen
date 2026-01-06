'use client';

import { Box, Button,
  Card, Flex,
  HStack,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
  Field,
  Separator,
} from '@chakra-ui/react';
import { useState } from 'react';

type LineItem = {
  description: string;
  qty: number;
  unitPriceForeign: number;
};

export default function CreateDeliveryOrderPage() {
//   const toast = useToast();

  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'IDR'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(15500); // editable currency rate
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', qty: 1, unitPriceForeign: 0 },
  ]);

  const subtotalForeign = lineItems.reduce(
    (sum, li) => sum + li.qty * li.unitPriceForeign,
    0
  );
  const subtotalIDR = subtotalForeign * exchangeRate;

  const handleLineChange = (i: number, key: keyof LineItem, value: any) => {
    const draft = [...lineItems];
    (draft[i] as any)[key] = value;
    setLineItems(draft);
  };

  const addRow = () =>
    setLineItems([...lineItems, { description: '', qty: 1, unitPriceForeign: 0 }]);

  const removeRow = (i: number) =>
    setLineItems(lineItems.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    const payload = {
      docType: 'SPPB/Delivery Order',
      currency,
      exchangeRate,
      items: lineItems,
      amounts: {
        subtotalForeign,
        subtotalIDR,
      },
    };

    // TODO: call API
    console.log('SUBMIT SPPB/DO', payload);

    // toast({
    //   title: 'Delivery Order created',
    //   description: 'SPPB / Delivery Order saved successfully.',
    //   status: 'success',
    // });
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        Create SPPB / Delivery Order
      </Heading>

      <Card.Root variant="outline">
        <Card.Header>
          <Heading size="sm">Document Information</Heading>
        </Card.Header>
        <Card.Body as={Stack} gap={4}>
          <HStack>
            <Field.Root>
              <Field.Label>DO / SPPB Number</Field.Label>
              <Input placeholder="e.g. DO-2026-0001" />
            </Field.Root>

            <Field.Root>
              <Field.Label>Issue Date</Field.Label>
              <Input type="date" />
            </Field.Root>

            <Field.Root>
              <Field.Label>Reference (SO / Job)</Field.Label>
              <Input placeholder="Link to Sales / Job Order" />
            </Field.Root>
          </HStack>

          <Separator />

          <Heading size="sm">Currency &amp; Exchange Rate</Heading>
          <HStack>
            <Field.Root maxW="200px">
              <Field.Label>Currency</Field.Label>
              {/* <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="IDR">IDR</option>
              </Select> */}
            </Field.Root>

            <Field.Root>
              <Field.Label>Exchange Rate (to IDR)</Field.Label>
              {/* <NumberInput
                value={exchangeRate}
                min={0}
                onChange={(_, v) => setExchangeRate(v || 0)}
              >
                <NumberInputField />
              </NumberInput> */}
              <Text fontSize="sm" color="gray.500">
                You can manually adjust this rate when customs / bank rate differs.
              </Text>
            </Field.Root>
          </HStack>

          <Separator />

          <Heading size="sm">Items / Charges</Heading>
          <Stack gap={3}>
            {lineItems.map((li, i) => (
              <Card.Root key={i} variant="subtle">
                <Card.Body as={Stack} gap={3}>
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Input
                      value={li.description}
                      onChange={(e) =>
                        handleLineChange(i, 'description', e.target.value)
                      }
                      placeholder="Cargo / Charge description"
                    />
                  </Field.Root>

                  <HStack>
                    <Field.Root maxW="140px">
                      <Field.Label>Qty</Field.Label>
                      {/* <NumberInput
                        min={1}
                        value={li.qty}
                        onChange={(_, v) => handleLineChange(i, 'qty', v || 1)}
                      >
                        <NumberInputField />
                      </NumberInput> */}
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Unit Price ({currency})</Field.Label>
                      {/* <NumberInput
                        min={0}
                        value={li.unitPriceForeign}
                        onChange={(_, v) =>
                          handleLineChange(i, 'unitPriceForeign', v || 0)
                        }
                      >
                        <NumberInputField />
                      </NumberInput> */}
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Line Total ({currency})</Field.Label>
                      <Input
                        value={(li.qty * li.unitPriceForeign).toFixed(2)}
                        
                      />
                    </Field.Root>

                    <Button
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => removeRow(i)}
                    >
                      Remove
                    </Button>
                  </HStack>
                </Card.Body>
              </Card.Root>
            ))}

            <Button onClick={addRow} variant="outline">
              Add Item / Charge
            </Button>
          </Stack>

          <Separator />

          <Heading size="sm">Totals</Heading>
          <Flex gap={6} wrap="wrap">
            <Box>
              <Text fontWeight="medium">
                Subtotal ({currency}): {subtotalForeign.toFixed(2)}
              </Text>
              <Text color="gray.600" fontSize="sm">
                Converted to IDR using editable exchange rate
              </Text>
            </Box>
            <Box>
              <Text fontWeight="medium">
                Subtotal (IDR): {subtotalIDR.toLocaleString('id-ID')}
              </Text>
            </Box>
          </Flex>

          <Separator />

          <Field.Root>
            <Field.Label>Remarks</Field.Label>
            <Textarea placeholder="Additional notes / delivery instructions" />
          </Field.Root>

          <Flex justify="flex-end" gap={3} mt={4}>
            <Button variant="ghost">Cancel</Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              Save Delivery Order
            </Button>
          </Flex>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}