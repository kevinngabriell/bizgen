'use client';

import Loading from '@/components/loading';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from '@/lib/auth/auth';
import {Button, Card, Flex, Heading, Input, Text, Textarea, Field, Separator, NumberInput} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';

type LineItem = {
  description: string;
  qty: number;
  unitPriceForeign: number;
};

export default function CreateDeliveryOrderPage() {
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
  };

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading size="lg" mb={4}>Create SPPB / Delivery Order</Heading>

      <Card.Root>
        <Card.Header>
          <Heading size="sm">Document Information</Heading>
        </Card.Header>
        <Card.Body>
          <Field.Root>
            <Field.Label>DO / SPPB Number</Field.Label>
            <Input placeholder="e.g. DO-2026-0001" />
          </Field.Root>
          <Field.Root mt={4}>
            <Field.Label>Issue Date</Field.Label>
            <Input type="date" />
          </Field.Root>
          <Field.Root mt={4}>
            <Field.Label>Reference (SO / Job)</Field.Label>
            <Input placeholder="Link to Sales / Job Order" />
          </Field.Root>

          <Separator mt={4} mb={4}/>

          <Heading size="sm" mb={3}>Currency &amp; Exchange Rate</Heading>

          <Field.Root maxW="200px">
            <Field.Label>Currency</Field.Label>
          </Field.Root>

          <Field.Root>
            <Field.Label>Exchange Rate (to IDR)</Field.Label>
            <NumberInput.Root>
              <NumberInput.Control/>
              <NumberInput.Input/>
            </NumberInput.Root>
            <Text fontSize="sm" color="gray.500">You can manually adjust this rate when customs / bank rate differs.</Text>
          </Field.Root>

          <Separator mt={5} mb={5}/>

          <Heading size="sm" mb={4}>Items / Charges</Heading>

          {lineItems.map((li, i) => (
            <Card.Root key={i} variant="subtle" mb={2}>
              <Card.Body gap={3}>
                <Field.Root>
                  <Field.Label>Description</Field.Label>
                  <Input value={li.description} onChange={(e) => handleLineChange(i, 'description', e.target.value)} placeholder="Cargo / Charge description"/>
                </Field.Root>
                <Field.Root maxW="140px">
                  <Field.Label>Qty</Field.Label>
                  <NumberInput.Root>
                    <NumberInput.Control/>
                    <NumberInput.Input/>
                  </NumberInput.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>Unit Price ({currency})</Field.Label>
                  <NumberInput.Root>
                    <NumberInput.Control/>
                    <NumberInput.Input/>
                  </NumberInput.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Line Total ({currency})</Field.Label>
                  <Input value={(li.qty * li.unitPriceForeign).toFixed(2)}/>
                </Field.Root>

                <Button color="red" variant="ghost" onClick={() => removeRow(i)}>Remove</Button>
              </Card.Body>
            </Card.Root>
          ))}

          <Button mt={4} mb={4} onClick={addRow} variant="outline">Add Item / Charge</Button>

          <Separator mt={4} mb={4} />
          
          <Heading size="sm" mb={6}>Totals</Heading>

          <Flex flexDirection={"column"}>
            <>
              <Text fontWeight="md">Subtotal ({currency}): {subtotalForeign.toFixed(2)}</Text>
              <Text color="gray.600" fontSize="sm">Converted to IDR using editable exchange rate</Text>
            </>
            <>
              <Text fontWeight="medium" mt={4} mb={5}>Subtotal (IDR): {subtotalIDR.toLocaleString('id-ID')}</Text>
            </>
          </Flex>

          <Separator mb={4} />

          <Field.Root>
            <Field.Label>Remarks</Field.Label>
            <Textarea placeholder="Additional notes / delivery instructions" />
          </Field.Root>

          <Flex justify="flex-end" gap={3} mt={4}>
            <Button variant="ghost">Cancel</Button>
            <Button colorScheme="blue" onClick={handleSubmit}>Save Delivery Order</Button>
          </Flex>
        </Card.Body>
      </Card.Root>

    </SidebarWithHeader>
    
  );
}