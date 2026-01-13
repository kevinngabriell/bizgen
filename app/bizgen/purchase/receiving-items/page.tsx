'use client';

import { Button, Card, Separator, Flex, Field, IconButton, Input, NumberInput, Text, Textarea, Heading, SimpleGrid } from '@chakra-ui/react';
// import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import dayjs from 'dayjs';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { FaTrash } from 'react-icons/fa';

interface ReceivingItemRow {
  id: string;
  sku: string;
  description: string;
  uom: string;
  qtyOrdered: number;
  qtyReceived: number;
  unitCost: number;
}

export default function CreateReceivingItemsPage() {
  const [form, setForm] = useState({
    poNumber: '',
    supplier: '',
    warehouse: '',
    receiptDate: dayjs().format('YYYY-MM-DD'),
    currency: 'IDR',
    exchangeRate: 1,
    remarks: '',
  });

  const [items, setItems] = useState<ReceivingItemRow[]>([
    {
      id: crypto.randomUUID(),
      sku: '',
      description: '',
      uom: '',
      qtyOrdered: 0,
      qtyReceived: 0,
      unitCost: 0,
    },
  ]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id: string, field: keyof ReceivingItemRow, value: any) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sku: '',
        description: '',
        uom: '',
        qtyOrdered: 0,
        qtyReceived: 0,
        unitCost: 0,
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const totalCost = items.reduce(
    (sum, x) => sum + Number(x.qtyReceived || 0) * Number(x.unitCost || 0),
    0,
  );

  const handleSubmit = (mode: 'save' | 'draft') => {

  };

  return (
    <SidebarWithHeader username='--'>
      <Heading fontSize="xl" fontWeight="bold" mb={4}> Create Receiving Items / Goods Receipt</Heading>
      
      <Card.Root>
        <Card.Header>
          <Text fontWeight="semibold">Receiving Details</Text>
        </Card.Header>
        <Card.Body>
          <SimpleGrid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
            <Field.Root>
              <Field.Label>PO Number / Reference</Field.Label>
              <Input placeholder="e.g. PO-2026-0012" value={form.poNumber} onChange={e => handleChange('poNumber', e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Supplier</Field.Label>
              <Input placeholder="Supplier name" value={form.supplier} onChange={e => handleChange('supplier', e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Warehouse / Location</Field.Label>
              <Input placeholder="Warehouse A — Jakarta" value={form.warehouse} onChange={e => handleChange('warehouse', e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Receipt Date</Field.Label>
              <Input type="date" value={form.receiptDate} onChange={e => handleChange('receiptDate', e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Currency</Field.Label>
              <NumberInput.Root>
                <NumberInput.Control/>
                <NumberInput.Input/>
              </NumberInput.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>Exchange Rate</Field.Label>
              <NumberInput.Root>
                <NumberInput.Control/>
                <NumberInput.Input/>
              </NumberInput.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>Remarks</Field.Label>
              <Textarea rows={3} placeholder="Notes, damages, partial receipt info, etc." value={form.remarks} onChange={e => handleChange('remarks', e.target.value)}/>
            </Field.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      <Card.Root mt={6}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading>Items Received</Heading>
            <Button size="sm" onClick={addItemRow}>Add Item</Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          {items.map((row, idx) => (
            <Card.Root key={row.id} p={3} mb={2}>
                <Field.Root>
                  <Field.Label>Item #{idx + 1}</Field.Label>
                  <IconButton aria-label="Remove row" size="sm" variant="ghost" color="red" onClick={() => removeItemRow(row.id)}>
                    <FaTrash/>
                  </IconButton>
                </Field.Root>

                <SimpleGrid templateColumns={{ base: '1fr', md: '2fr 2fr 1fr 1fr 1fr' }} gap={3}>
                  <Field.Root>
                    <Field.Label>SKU / Item Code</Field.Label>
                    <Input value={row.sku} onChange={e => handleItemChange(row.id, 'sku', e.target.value)} placeholder="SKU-001"/>
                  </Field.Root>
                  
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Input value={row.description} onChange={e => handleItemChange(row.id, 'description', e.target.value)} placeholder="Item description"/>
                  </Field.Root>
                  
                  <Field.Root>
                    <Field.Label>UOM</Field.Label>
                    <Input value={row.uom} onChange={e => handleItemChange(row.id, 'uom', e.target.value)} placeholder="PCS / BOX"/>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Qty Received</Field.Label>
                    <NumberInput.Root>
                      <NumberInput.Control/>
                      <NumberInput.Input/>
                    </NumberInput.Root>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Unit Cost</Field.Label>
                    <NumberInput.Root>
                      <NumberInput.Control/>
                      <NumberInput.Input/>
                    </NumberInput.Root>
                  </Field.Root>

                </SimpleGrid>
            </Card.Root>
          ))}

          <Separator my={4} />

          <Flex justify="space-between" align="center">
            <Text fontWeight="medium">Total Cost</Text>
            <Text fontSize="lg" fontWeight="bold">{form.currency} {totalCost.toLocaleString()}</Text>
          </Flex>
        </Card.Body>
      </Card.Root>
      
      <Flex mt={6} gap={3} justify="flex-end">
        <Button variant="outline" onClick={() => handleSubmit('draft')}>Save as Draft</Button>
        <Button colorScheme="teal" onClick={() => handleSubmit('save')}>Post Receiving</Button>
      </Flex>
    </SidebarWithHeader>
    
  );
}