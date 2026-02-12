'use client';

import Loading from '@/components/loading';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import { Button, Card, Separator, Flex, Field, Heading, IconButton, Input, NumberInput, Textarea, SimpleGrid} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

interface PurchaseItem {
  id: string;
  description: string;
  qty: number;
  uom: string;
  price: number;
  remarks: string;
}

export default function CreatePurchaseLocalPage() {
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

  const [form, setForm] = useState({
    poNumber: '',
    poDate: '',
    supplier: '',
    currency: 'IDR',
    paymentTerms: '',
    notes: '',
  });

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      qty: 1,
      uom: 'PCS',
      price: 0,
      remarks: '',
    },
  ]);

  const handleChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateItem = (id: string, key: keyof PurchaseItem, value: any) => {
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, [key]: value } : i)),
    );
  };

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: '',
        qty: 1,
        uom: 'PCS',
        price: 0,
        remarks: '',
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  const handleSave = (type: 'draft' | 'submit') => {
    // TODO: integrate API
    console.log({ form, items, status: type });
  };

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between" align="center">
        <Heading size="lg">Create Purchase (Local)</Heading>
        <Flex gap={6}>
          <Button variant="outline" onClick={() => handleSave('draft')}>Save Draft</Button>
          <Button colorScheme="blue" onClick={() => handleSave('submit')}>Submit Purchase</Button>
        </Flex>
      </Flex>

      <Card.Root mt={5}>
        <Card.Header>
          <Heading size="md">Purchase Details</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
            <Field.Root>
              <Field.Label>PO Number</Field.Label>
              <Input placeholder="Auto / Manual" value={form.poNumber} onChange={e => handleChange('poNumber', e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>PO Date</Field.Label>
              <Input type="date" value={form.poDate} onChange={e => handleChange('poDate', e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Supplier</Field.Label>
              <Input placeholder="Supplier Name" value={form.supplier} onChange={e => handleChange('supplier', e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Currency</Field.Label>
              {/* Harusnya selection */}
            </Field.Root>
            <Field.Root>
              <Field.Label>Payment Terms</Field.Label>
              <Input placeholder="e.g. 30 Days, Cash" value={form.paymentTerms} onChange={e => handleChange('paymentTerms', e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Notes</Field.Label>
              <Textarea rows={3} placeholder="Additional notes" value={form.notes} onChange={e => handleChange('notes', e.target.value)}/>
            </Field.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>
      
      <Card.Root mt={5}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">Purchase Items</Heading>
            <Button size="sm" onClick={addItem}>
              <FaPlus/>Add Item
            </Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          {items.map(item => (
            <Card.Root key={item.id} p={3}>
              <SimpleGrid templateColumns={{base: '1fr',md: '2fr 0.6fr 0.8fr 1fr 0.6fr auto',}} gap={6} alignItems={"center"}>
                <Field.Root>
                  <Field.Label>Description</Field.Label>
                  <Input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)}/>
                </Field.Root>
                <Field.Root>
                  <Field.Label>Qty</Field.Label>
                  <NumberInput.Root>
                    <NumberInput.Control/>
                    <NumberInput.Input/>
                  </NumberInput.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>UOM</Field.Label>
                  <Input value={item.uom} onChange={e => updateItem(item.id, 'uom', e.target.value)}/>
                </Field.Root>
                <Field.Root>
                  <Field.Label>Unit Price</Field.Label>
                  <NumberInput.Root>
                    <NumberInput.Control/>
                    <NumberInput.Input/>
                  </NumberInput.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>Remarks</Field.Label>
                  <Input value={item.remarks} onChange={e => updateItem(item.id, 'remarks', e.target.value)}/>
                </Field.Root>
                <IconButton aria-label="Remove item" p={2} color="red" variant="ghost" onClick={() => removeItem(item.id)}>
                  <FaTrash/> Delete
                </IconButton>
              </SimpleGrid>
            </Card.Root>
          ))}

          <Separator mt={7} mb={7}/>

          <Flex justify="flex-end" fontWeight="semibold" fontSize={"md"}>
            Subtotal: {form.currency} {subtotal.toLocaleString()}
          </Flex>
        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
    
  );
}