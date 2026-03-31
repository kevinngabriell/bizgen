'use client';

import Loading from '@/components/loading';
import PurchaseOrderLookup, { PurchaseOrderEntry } from '@/components/lookup/PurchaseOrderLookup';
import SupplierLookup from '@/components/lookup/SupplierLookup';
import { AlertMessage } from '@/components/ui/alert';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { getAllCurrency, GetCurrencyData } from '@/lib/master/currency';
import { getAllItem, GetItemData } from '@/lib/master/item';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { getAllUOM, UOMData } from '@/lib/master/uom';
import { GetSupplierData } from '@/lib/master/supplier';
import { createPurchaseInvoice, generatePurchaseInvoiceNumber } from '@/lib/purchase/invoice';
import {
  Box, Button, Card, Combobox, createListCollection,
  Field, Flex, Heading, IconButton, Input, Portal,
  Select, Separator, SimpleGrid, Stack, Text, Textarea,
  useFilter, useListCollection,
} from '@chakra-ui/react';
import { Suspense, useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';

const BIZGEN_COLOR = '#E77A1F';

type InvoiceItem = {
  id: string;
  itemId: string;
  description: string;
  qty: string;
  uomId: string;
  packageSize: string;
  unitPrice: string;
  total: string;
  vatPercent: string;
  vatAmount: string;
  grandTotal: string;
  remarks: string;
};

function newItem(): InvoiceItem {
  return {
    id: crypto.randomUUID(),
    itemId: '', description: '', qty: '', uomId: '', packageSize: '',
    unitPrice: '', total: '0', vatPercent: '0', vatAmount: '0', grandTotal: '0', remarks: '',
  };
}

function calcItem(item: InvoiceItem): InvoiceItem {
  const qty = parseFloat(item.qty) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const vatPct = parseFloat(item.vatPercent) || 0;
  const total = qty * price;
  const vatAmount = total * (vatPct / 100);
  return {
    ...item,
    total: total.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    grandTotal: (total + vatAmount).toFixed(2),
  };
}

export default function CreatePurchaseInvoicePage() {
  return (
    <Suspense fallback={<Loading />}>
      <PurchaseInvoiceContent />
    </Suspense>
  );
}

function PurchaseInvoiceContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const t = getLang(lang);
  const tr = t.purchase_invoice;

  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Master data
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);
  const [uomOptions, setUomOptions] = useState<UOMData[]>([]);
  const [termOptions, setTermOptions] = useState<GetTermData[]>([]);
  const [itemMasterAll, setItemMasterAll] = useState<GetItemData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((c) => ({
      label: `${c.currency_code} — ${c.currency_name}`,
      value: c.currency_id,
    })),
  });

  const uomCollection = createListCollection({
    items: uomOptions.map((u) => ({ label: u.uom_name, value: u.uom_id })),
  });

  const termCollection = createListCollection({
    items: termOptions.map((tm) => ({ label: tm.term_name, value: tm.term_id })),
  });

  // Item combobox — searchable
  const { contains } = useFilter({ sensitivity: 'base' });
  const { collection: itemCollection, set: setItemCollection } =
    useListCollection<GetItemData>({
      initialItems: [],
      itemToString: (i) => `${i.item_code} — ${i.item_name}`,
      itemToValue: (i) => i.item_id,
    });

  // Supplier lookup
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<GetSupplierData | null>(null);

  // Purchase Order lookup
  const [poLookupOpen, setPoLookupOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderEntry | null>(null);
  const purchaseOrderLocalId = selectedPO?.purchase_type === 'local' ? selectedPO.purchase_id : '';
  const purchaseOrderImportId = selectedPO?.purchase_type === 'import' ? selectedPO.purchase_import_id : '';

  // Selects
  const [currencySelected, setCurrencySelected] = useState<string>();
  const [termSelected, setTermSelected] = useState<string>();

  // Header form
  const [form, setForm] = useState({
    invoice_number: '',
    po_number: '',
    invoice_date: '',
    ship_date: '',
    exchange_rate: '',
    notes: '',
  });

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([newItem()]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if (!valid) return;

        const info = getAuthInfo();
        setAuth(info);
        setLang(info?.language === 'id' ? 'id' : 'en');

        const [numberRes, currencyRes, uomRes, termRes, itemRes] = await Promise.all([
          generatePurchaseInvoiceNumber(),
          getAllCurrency(1, 1000),
          getAllUOM(1, 1000),
          getAllTerm(1, 1000),
          getAllItem(1, 1000),
        ]);

        setForm((prev) => ({ ...prev, invoice_number: numberRes.number }));
        setCurrencyOptions(currencyRes?.data ?? []);
        setUomOptions(uomRes?.data ?? []);
        setTermOptions(termRes?.data ?? []);

        const itemData = itemRes?.data ?? [];
        setItemMasterAll(itemData);
        setItemCollection(itemData);
      } catch (err) {
        console.error('Failed to initialize:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // Item handlers
  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return calcItem({ ...item, [field]: value });
      })
    );
  };

  const handleItemSelect = (id: string, itemId: string) => {
    const found = itemMasterAll.find((i) => i.item_id === itemId);
    if (!found) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return calcItem({
          ...item,
          itemId: found.item_id,
          description: found.item_name,
          uomId: found.default_uom ?? '',
        });
      })
    );
  };

  const addItem = () => setItems((prev) => [...prev, newItem()]);

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((i) => i.id !== id)));
  };

  // Footer totals
  const totalSubtotal = items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
  const totalVat = items.reduce((s, i) => s + (parseFloat(i.vatAmount) || 0), 0);
  const totalGrand = items.reduce((s, i) => s + (parseFloat(i.grandTotal) || 0), 0);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const selectedCurrencyCode =
    currencyOptions.find((c) => c.currency_id === currencySelected)?.currency_code ?? '';

  const handleChooseSupplier = (supplier: GetSupplierData) => {
    setSelectedSupplier(supplier);
    setSupplierModalOpen(false);
  };

  const handleChoosePO = (entry: PurchaseOrderEntry) => {
    setSelectedPO(entry);
  };

  const resetForm = async () => {
    const res = await generatePurchaseInvoiceNumber();
    setForm({ invoice_number: res.number, po_number: '', invoice_date: '', ship_date: '', exchange_rate: '', notes: '' });
    setSelectedSupplier(null);
    setSelectedPO(null);
    setCurrencySelected(undefined);
    setTermSelected(undefined);
    setItems([newItem()]);
  };

  const handleSubmit = async (mode: 'draft' | 'posted') => {
    try {
      if (!form.invoice_number) throw new Error(tr.error_invoice_number);
      if (!selectedSupplier?.supplier_id) throw new Error(tr.error_supplier);
      if (!form.invoice_date) throw new Error(tr.error_invoice_date);
      if (!purchaseOrderLocalId && !purchaseOrderImportId) throw new Error(tr.error_po);
      if (items.length === 0) throw new Error(tr.error_items);
      if (items.some((i) => !i.itemId)) throw new Error(tr.error_item_id);
      if (items.some((i) => Number(i.qty) <= 0)) throw new Error(tr.error_item_qty);
      if (items.some((i) => Number(i.unitPrice) <= 0)) throw new Error(tr.error_item_price);

      setLoading(true);

      await createPurchaseInvoice({
        invoice_number: form.invoice_number,
        supplier_id: selectedSupplier.supplier_id,
        invoice_date: form.invoice_date,
        purchase_order_local_id: purchaseOrderLocalId,
        purchase_order_import_id: purchaseOrderImportId,
        due_date: form.ship_date,
        term_id: termSelected ?? '',
        currency_id: currencySelected ?? '',
        exchange_rate_to_idr: form.exchange_rate,
        notes: form.notes,
        items: items.map(({ id: _id, ...rest }) => ({
          item_id: rest.itemId,
          uom_id: rest.uomId,
          quantity: rest.qty,
          unit_price: rest.unitPrice,
          tax_percent: rest.vatPercent,
          notes: rest.remarks,
        })),
      });

      setIsSuccess(true);
      setTitlePopup(t.master.success);
      setMessagePopup(mode === 'draft' ? tr.success_draft : tr.success_create);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 6000);

      await resetForm();
    } catch (err: any) {
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(err.message || t.master.error_msg);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 6000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <SidebarWithHeader username={auth?.username ?? 'Unknown'} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between" align="center" mb={6}>
        <Flex flexDir="column">
          <Heading size="lg">{tr.title}</Heading>
          <Text color="gray.500" fontSize="sm">{tr.subtitle}</Text>
        </Flex>
        <Flex gap={3}>
          <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={() => handleSubmit('draft')}>
            {tr.save_draft}
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={() => handleSubmit('posted')}>
            {tr.post_invoice}
          </Button>
        </Flex>
      </Flex>

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

      <SupplierLookup
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onChoose={handleChooseSupplier}
      />

      <PurchaseOrderLookup
        isOpen={poLookupOpen}
        onClose={() => setPoLookupOpen(false)}
        onChoose={handleChoosePO}
      />

      <Stack gap={6}>
        {/* Invoice Details */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">{tr.invoice_details}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.invoice_number}<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  placeholder={tr.invoice_number_placeholder}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label fontSize="sm">{tr.supplier}<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={selectedSupplier?.supplier_name ?? ''}
                  readOnly
                  cursor="pointer"
                  placeholder={tr.supplier_placeholder}
                  onClick={() => setSupplierModalOpen(true)}
                />
              </Field.Root>

              {/* Supplier info */}
              <Field.Root>
                <Field.Label fontSize="sm">{tr.supplier_info}</Field.Label>
                <Box fontSize="xs" color="gray.500" lineHeight="short" pt={1}>
                  <Text>{selectedSupplier?.origin_name ?? '—'}</Text>
                  <Text>{selectedSupplier?.currency_name ? `Currency: ${selectedSupplier.currency_name}` : '—'}</Text>
                  <Text>{selectedSupplier?.term_name ? `Term: ${selectedSupplier.term_name}` : '—'}</Text>
                </Box>
              </Field.Root>

              {/* Purchase Order lookup */}
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.po_number}<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={selectedPO ? `[${selectedPO.purchase_type.toUpperCase()}] ${selectedPO.po_number}` : ''}
                  readOnly
                  cursor="pointer"
                  placeholder={tr.po_number_placeholder}
                  onClick={() => setPoLookupOpen(true)}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label fontSize="sm">{tr.invoice_date}<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="date"
                  value={form.invoice_date}
                  onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{tr.ship_date}</Field.Label>
                <Input
                  type="date"
                  value={form.ship_date}
                  onChange={(e) => setForm({ ...form, ship_date: e.target.value })}
                />
              </Field.Root>

              {/* Currency */}
              <Field.Root>
                <Field.Label fontSize="sm">{tr.currency}</Field.Label>
                <Select.Root
                  collection={currencyCollection}
                  value={currencySelected ? [currencySelected] : []}
                  onValueChange={(d) => setCurrencySelected(d.value[0])}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={tr.currency_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {currencyCollection.items.map((c) => (
                          <Select.Item item={c} key={c.value}>{c.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>

              {/* Exchange Rate */}
              <Field.Root>
                <Field.Label fontSize="sm">{tr.exchange_rate}</Field.Label>
                <Input
                  type="number"
                  value={form.exchange_rate}
                  onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })}
                  placeholder={tr.exchange_rate_placeholder}
                />
              </Field.Root>

              {/* Term */}
              <Field.Root>
                <Field.Label fontSize="sm">{tr.term}</Field.Label>
                <Select.Root
                  collection={termCollection}
                  value={termSelected ? [termSelected] : []}
                  onValueChange={(d) => setTermSelected(d.value[0])}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={tr.term_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {termCollection.items.map((tm) => (
                          <Select.Item item={tm} key={tm.value}>{tm.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
            </SimpleGrid>

            <Field.Root mt={4}>
              <Field.Label fontSize="sm">{tr.notes}</Field.Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={tr.notes_placeholder}
              />
            </Field.Root>
          </Card.Body>
        </Card.Root>

        {/* Invoice Items */}
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Heading size="md">{tr.invoice_items}</Heading>
              <Button size="sm" bg={BIZGEN_COLOR} color="white" onClick={addItem}>
                {tr.add_item}
              </Button>
            </Flex>
          </Card.Header>
          <Card.Body>
            <Box overflowX="auto">
              {/* Column headers */}
              <Flex minW="1500px" gap={3} mb={2} px={1}>
                {[
                  ['32px', '#'],
                  ['220px', tr.item_name],
                  ['80px', tr.qty],
                  ['110px', tr.uom],
                  ['130px', tr.packaging_size],
                  ['140px', `${tr.unit_price}${selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}`],
                  ['120px', tr.item_total],
                  ['80px', tr.vat_percent],
                  ['110px', tr.vat_amount],
                  ['130px', tr.grand_total],
                  ['110px', tr.remarks],
                  ['40px', ''],
                ].map(([w, label], i) => (
                  <Box key={i} w={w} flexShrink={0}>
                    <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{label}</Text>
                  </Box>
                ))}
              </Flex>

              {/* Item rows */}
              {items.map((item, idx) => (
                <Flex key={item.id} minW="1500px" gap={3} mb={3} align="center" px={1}>
                  <Box w="32px" flexShrink={0}>
                    <Text fontSize="sm" color="gray.400">{idx + 1}</Text>
                  </Box>

                  {/* Item combobox */}
                  <Box w="220px" flexShrink={0}>
                    <Combobox.Root
                      collection={itemCollection}
                      onValueChange={(d) => handleItemSelect(item.id, d.value?.[0] ?? '')}
                      onInputValueChange={(e) => {
                        const input = e.inputValue ?? '';
                        if (!input.trim()) { setItemCollection(itemMasterAll); return; }
                        setItemCollection(
                          itemMasterAll.filter((i) =>
                            contains(i.item_name, input) || contains(i.item_code, input)
                          )
                        );
                      }}
                    >
                      <Combobox.Control>
                        <Combobox.Input
                          placeholder={tr.item_name_placeholder}
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          onFocus={() => setItemCollection(itemMasterAll)}
                        />
                        <Combobox.IndicatorGroup>
                          <Combobox.Trigger />
                        </Combobox.IndicatorGroup>
                      </Combobox.Control>
                      <Portal>
                        <Combobox.Positioner>
                          <Combobox.Content>
                            <Combobox.Empty>No items found</Combobox.Empty>
                            {itemCollection.items.map((i) => (
                              <Combobox.Item item={i} key={i.item_id}>
                                {i.item_code} — {i.item_name}
                                <Combobox.ItemIndicator />
                              </Combobox.Item>
                            ))}
                          </Combobox.Content>
                        </Combobox.Positioner>
                      </Portal>
                    </Combobox.Root>
                  </Box>

                  <Box w="80px" flexShrink={0}>
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.qty}
                      onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                    />
                  </Box>

                  <Box w="110px" flexShrink={0}>
                    <Select.Root
                      collection={uomCollection}
                      value={item.uomId ? [item.uomId] : []}
                      onValueChange={(d) => handleItemChange(item.id, 'uomId', d.value[0])}
                      width="100%"
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder={tr.uom_placeholder} />
                        </Select.Trigger>
                        <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {uomCollection.items.map((u) => (
                              <Select.Item item={u} key={u.value}>{u.label}<Select.ItemIndicator /></Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Box>

                  <Box w="130px" flexShrink={0}>
                    <Input
                      placeholder={tr.packaging_size_placeholder}
                      value={item.packageSize}
                      onChange={(e) => handleItemChange(item.id, 'packageSize', e.target.value)}
                    />
                  </Box>

                  <Box w="140px" flexShrink={0}>
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                    />
                  </Box>

                  <Box w="120px" flexShrink={0}>
                    <Input value={fmt(parseFloat(item.total) || 0)} readOnly bg="gray.50" />
                  </Box>

                  <Box w="80px" flexShrink={0}>
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.vatPercent}
                      onChange={(e) => handleItemChange(item.id, 'vatPercent', e.target.value)}
                    />
                  </Box>

                  <Box w="110px" flexShrink={0}>
                    <Input value={fmt(parseFloat(item.vatAmount) || 0)} readOnly bg="gray.50" />
                  </Box>

                  <Box w="130px" flexShrink={0}>
                    <Input value={fmt(parseFloat(item.grandTotal) || 0)} readOnly bg="gray.50" fontWeight="semibold" />
                  </Box>

                  <Box w="110px" flexShrink={0}>
                    <Input
                      placeholder={tr.remarks_placeholder}
                      value={item.remarks}
                      onChange={(e) => handleItemChange(item.id, 'remarks', e.target.value)}
                    />
                  </Box>

                  <Box w="40px" flexShrink={0}>
                    <IconButton aria-label="Remove item" variant="ghost" color="red.500" size="sm" onClick={() => removeItem(item.id)}>
                      <FaTrash />
                    </IconButton>
                  </Box>
                </Flex>
              ))}

              {/* Totals footer */}
              <Separator mt={2} mb={4} />
              <Flex justify="flex-end" minW="1500px" pr={1}>
                <Box w="420px">
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" color="gray.600">
                      {tr.subtotal}{selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}
                    </Text>
                    <Text fontSize="sm" fontWeight="semibold">{fmt(totalSubtotal)}</Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" color="gray.600">{tr.total_vat}</Text>
                    <Text fontSize="sm" fontWeight="semibold">{fmt(totalVat)}</Text>
                  </Flex>
                  <Separator mb={2} />
                  <Flex justify="space-between">
                    <Text fontWeight="bold">
                      {tr.total_grand}{selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}
                    </Text>
                    <Text fontWeight="bold" color={BIZGEN_COLOR}>{fmt(totalGrand)}</Text>
                  </Flex>
                </Box>
              </Flex>
            </Box>
          </Card.Body>
        </Card.Root>
      </Stack>

      <Flex justify="flex-end" gap={3} mt={6}>
        <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={() => handleSubmit('draft')}>
          {tr.save_draft}
        </Button>
        <Button bg={BIZGEN_COLOR} color="white" onClick={() => handleSubmit('posted')}>
          {tr.post_invoice}
        </Button>
      </Flex>
    </SidebarWithHeader>
  );
}
