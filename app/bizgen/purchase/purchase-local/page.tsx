'use client';

import Loading from '@/components/loading';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { getAllCurrency, GetCurrencyData } from '@/lib/master/currency';
import { getAllSupplier, GetSupplierData } from '@/lib/master/supplier';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { Button, Card, Separator, Flex, Field, Heading, IconButton, Input, NumberInput, Textarea, SimpleGrid, createListCollection, Select, Portal} from '@chakra-ui/react';
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

  const t = getLang("en");  

  const [supplierSelected, setSupplierSelected] = useState<string>();
  const [supplierOptions, setSupplierOptions] = useState<GetSupplierData[]>([]);

  const supplierCollection = createListCollection({
    items: supplierOptions.map((supplier) => ({
        label: `${supplier.supplier_name}`,
        value: supplier.supplier_id,
      })),
  });

  //currency
  const [currencySelected, setCurrencySelected] = useState<string>();
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((currency) => ({
        label: `${currency.currency_name} (${currency.currency_symbol})`,
        value: currency.currency_id,
      })),
  });

  //term
  const [termSelected, setTermSelected] = useState<string>();
  const [termOptions, seetTermOptions] = useState<GetTermData[]>([]);

  const termCollection = createListCollection({
    items: termOptions.map((term) => ({
        label: `${term.term_name}`,
        value: term.term_id,
      })),
  });

  useEffect(() => {

    const fetchCurrency = async () => {
      try {
        const currencyRes = await getAllCurrency(1, 1000);
        setCurrencyOptions(currencyRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setCurrencyOptions([]);
      }
    };

    const fetchSupplier = async () => {
      try {
        const supplierRes = await getAllSupplier(1, 1000);
        setSupplierOptions(supplierRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setSupplierOptions([]);
      }
    };

    const fetchTerm = async () => {
      try {
        const termRes = await getAllTerm(1, 1000);
        seetTermOptions(termRes?.data ?? []);
      } catch (error) {
        console.error(error);
        seetTermOptions([]);
      }
    };

    fetchCurrency();
    fetchTerm();
    fetchSupplier();
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
    console.log({ form, items, status: type });
  }; 
  
  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between" align="center">
        <Heading size="lg">{t.purchase_local.title}</Heading>
        <Flex gap={6}>
          <Button variant="outline" onClick={() => handleSave('draft')}>{t.purchase_local.save_draft}</Button>
          <Button colorScheme="blue" onClick={() => handleSave('submit')}>{t.purchase_local.submit_purchase}</Button>
        </Flex>
      </Flex>

      <Card.Root mt={5}>
        <Card.Header>
          <Heading size="md">{t.purchase_local.purchase_details}</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
            <Field.Root>
              <Field.Label>{t.purchase_local.po_number}</Field.Label>
              <Input placeholder={t.purchase_local.po_number_placeholder} value={form.poNumber} onChange={e => handleChange('poNumber', e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.purchase_local.po_date}</Field.Label>
              <Input type="date" value={form.poDate} onChange={e => handleChange('poDate', e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.purchase_local.supplier}</Field.Label>
              <Select.Root collection={supplierCollection} value={supplierSelected ? [supplierSelected] : []} onValueChange={(details) => setSupplierSelected(details.value[0])} size="sm" width="100%">
                              <Select.HiddenSelect />
                              <Select.Control>
                                <Select.Trigger>
                                  <Select.ValueText placeholder={t.purchase_local.supplier_placeholder} />
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                  <Select.Indicator />
                                </Select.IndicatorGroup>
                              </Select.Control>
                              <Portal>
                                <Select.Positioner>
                                  <Select.Content>
                                    {supplierCollection.items.map((supplier) => (
                                      <Select.Item item={supplier} key={supplier.value}>
                                        {supplier.label}
                                        <Select.ItemIndicator />
                                      </Select.Item>
                                    ))}
                                  </Select.Content>
                                </Select.Positioner>
                              </Portal>
                            </Select.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.purchase_local.currency}</Field.Label>
              <Select.Root collection={currencyCollection} value={currencySelected ? [currencySelected] : []} onValueChange={(details) => setCurrencySelected(details.value[0])} size="sm" width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.purchase_local.currency_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {currencyCollection.items.map((currency) => (
                        <Select.Item item={currency} key={currency.value}>
                          {currency.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.purchase_local.payment_terms}</Field.Label>
              <Input placeholder={t.purchase_local.payment_terms_placeholder} value={form.paymentTerms} onChange={e => handleChange('paymentTerms', e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.purchase_local.notes}</Field.Label>
              <Textarea rows={3} placeholder={t.purchase_local.notes_placeholder} value={form.notes} onChange={e => handleChange('notes', e.target.value)}/>
            </Field.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>
      
      <Card.Root mt={5}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">{t.purchase_local.purchase_items}</Heading>
            <Button size="sm" onClick={addItem}>
              <FaPlus/>{t.purchase_local.add_item}
            </Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          {items.map(item => (
            <Card.Root key={item.id} p={3}>
              <SimpleGrid templateColumns={{base: '1fr',md: '2fr 0.6fr 0.8fr 1fr 0.6fr auto',}} gap={6} alignItems={"center"}>
                <Field.Root>
                  <Field.Label>{t.purchase_local.description}</Field.Label>
                  <Input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)}/>
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t.purchase_local.qty}</Field.Label>
                  <NumberInput.Root>
                    <NumberInput.Control/>
                    <NumberInput.Input/>
                  </NumberInput.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t.purchase_local.uom}</Field.Label>
                  <Input value={item.uom} onChange={e => updateItem(item.id, 'uom', e.target.value)}/>
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t.purchase_local.unit_price}</Field.Label>
                  <NumberInput.Root>
                    <NumberInput.Control/>
                    <NumberInput.Input/>
                  </NumberInput.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t.purchase_local.remarks}</Field.Label>
                  <Input value={item.remarks} onChange={e => updateItem(item.id, 'remarks', e.target.value)}/>
                </Field.Root>
                <IconButton aria-label="Remove item" p={2} color="red" variant="ghost" onClick={() => removeItem(item.id)}>
                  <FaTrash/> {t.purchase_local.delete_item}
                </IconButton>
              </SimpleGrid>
            </Card.Root>
          ))}

          <Separator mt={7} mb={7}/>

          <Flex justify="flex-end" fontWeight="semibold" fontSize={"md"}>
            {t.purchase_local.subtotal}: {form.currency} {subtotal.toLocaleString()}
          </Flex>
        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
    
  );
}