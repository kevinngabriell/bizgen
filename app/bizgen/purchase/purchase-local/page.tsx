

'use client';

import {
  Box,
  Button,
  Card,
  Separator,
  Flex,
  Field,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Input,
  NumberInput,
  Select,
  Stack,
  Textarea,
} from '@chakra-ui/react';
// import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useState } from 'react';

interface PurchaseItem {
  id: string;
  description: string;
  qty: number;
  uom: string;
  price: number;
  remarks: string;
}

export default function CreatePurchaseLocalPage() {
//   const toast = useToast();

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

    // toast({
    //   title: type === 'draft' ? 'Saved as Draft' : 'Purchase Submitted',
    //   status: type === 'draft' ? 'info' : 'success',
    //   duration: 2000,
    // });
  };

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center">
        <Heading size="lg">Create Purchase (Local)</Heading>

        <HStack>
          <Button variant="outline" onClick={() => handleSave('draft')}>
            Save Draft
          </Button>
          <Button colorScheme="blue" onClick={() => handleSave('submit')}>
            Submit Purchase
          </Button>
        </HStack>
      </Flex>

      <Card.Root>
        <Card.Header>
          <Heading size="sm">Purchase Details</Heading>
        </Card.Header>
        <Separator />
        <Card.Body>
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
            <GridItem>
              <Field.Root>
                <Field.Label>PO Number</Field.Label>
                <Input
                  placeholder="Auto / Manual"
                  value={form.poNumber}
                  onChange={e => handleChange('poNumber', e.target.value)}
                />
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>PO Date</Field.Label>
                <Input
                  type="date"
                  value={form.poDate}
                  onChange={e => handleChange('poDate', e.target.value)}
                />
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>Supplier</Field.Label>
                <Input
                  placeholder="Supplier Name"
                  value={form.supplier}
                  onChange={e => handleChange('supplier', e.target.value)}
                />
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>Currency</Field.Label>
                {/* <Select
                  value={form.currency}
                  onChange={e => handleChange('currency', e.target.value)}
                >
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                </Select> */}
              </Field.Root>
            </GridItem>

            <GridItem>
              <Field.Root>
                <Field.Label>Payment Terms</Field.Label>
                <Input
                  placeholder="e.g. 30 Days, Cash"
                  value={form.paymentTerms}
                  onChange={e => handleChange('paymentTerms', e.target.value)}
                />
              </Field.Root>
            </GridItem>

            <GridItem colSpan={2}>
              <Field.Root>
                <Field.Label>Notes</Field.Label>
                <Textarea
                  rows={3}
                  placeholder="Additional notes"
                  value={form.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                />
              </Field.Root>
            </GridItem>
          </Grid>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="sm">Purchase Items</Heading>
            {/* <Button leftIcon={<AddIcon />} size="sm" onClick={addItem}>
              Add Item
            </Button> */}
          </Flex>
        </Card.Header>
        <Separator />
        <Card.Body>
          <Stack gap={4}>
            {items.map(item => (
              <Box
                key={item.id}
                borderWidth="1px"
                borderRadius="lg"
                p={3}
              >
                <Grid
                  templateColumns={{
                    base: '1fr',
                    md: '2fr 0.6fr 0.8fr 1fr 0.6fr auto',
                  }}
                  gap={3}
                  alignItems="center"
                >
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Input
                      value={item.description}
                      onChange={e =>
                        updateItem(item.id, 'description', e.target.value)
                      }
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Qty</Field.Label>
                    {/* <NumberInput
                      min={1}
                      value={item.qty}
                      onChange={(_, v) =>
                        updateItem(item.id, 'qty', v || 0)
                      }
                    >
                      <NumberInputField />
                    </NumberInput> */}
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>UOM</Field.Label>
                    <Input
                      value={item.uom}
                      onChange={e =>
                        updateItem(item.id, 'uom', e.target.value)
                      }
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Unit Price</Field.Label>
                    {/* <NumberInput
                      min={0}
                      value={item.price}
                      onChange={(_, v) =>
                        updateItem(item.id, 'price', v || 0)
                      }
                    >
                      <NumberInputField />
                    </NumberInput> */}
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Remarks</Field.Label>
                    <Input
                      value={item.remarks}
                      onChange={e =>
                        updateItem(item.id, 'remarks', e.target.value)
                      }
                    />
                  </Field.Root>

                  <IconButton
                    aria-label="Remove item"
                    // icon={<DeleteIcon />}
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                  />
                </Grid>
              </Box>
            ))}

            <Separator />

            <Flex justify="flex-end" fontWeight="semibold">
              Subtotal: {form.currency} {subtotal.toLocaleString()}
            </Flex>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}