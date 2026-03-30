'use client';

import Loading from '@/components/loading';
import SupplierLookup from '@/components/lookup/SupplierLookup';
import { AlertMessage } from '@/components/ui/alert';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { getCompanyProfile, GetCompanyProfile } from '@/lib/account/company';
import { getAllCurrency, GetCurrencyData } from '@/lib/master/currency';
import { getAllItem, GetItemData } from '@/lib/master/item';
import { getAllPaymentMethod, GetPaymentMethodData } from '@/lib/master/payment-method';
import { getAllTax, GetTaxData } from '@/lib/master/tax';
import { getAllUOM, UOMData } from '@/lib/master/uom';
import { GetSupplierData } from '@/lib/master/supplier';
import { createPurchaseLocal, generatePurchaseLocalNumber } from '@/lib/purchase/local';
import { Box, Button, Card, Combobox, createListCollection, Field, Flex, Heading, Icon, IconButton, Input, Portal, Select, Separator, SimpleGrid, Stack, Text, Textarea, useFilter, useListCollection } from '@chakra-ui/react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { FiFileText, FiUpload, FiX } from 'react-icons/fi';

const BIZGEN_COLOR = '#E77A1F';

type PurchaseItem = {
  id: string;
  itemId: string;
  description: string;
  qty: string;
  uomId: string;
  packageSize: string;
  unitPrice: string;
  total: string;
  dpp: string;
  ppn: string;
  grandTotal: string;
  remarks: string;
};

function newItem(): PurchaseItem {
  return {
    id: crypto.randomUUID(),
    itemId: '', description: '', qty: '', uomId: '', packageSize: '',
    unitPrice: '', total: '0', dpp: '0', ppn: '0', grandTotal: '0', remarks: '',
  };
}

function calcItem(item: PurchaseItem, tax: GetTaxData | undefined): PurchaseItem {
  const qty = parseFloat(item.qty) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const base = qty * price;

  let dpp = base;
  let ppn = 0;

  if (tax) {
    const rate = parseFloat(tax.tax_rate || '0') / 100;
    if (tax.calculation_method === 'normal') {
      dpp = base;
      ppn = base * rate;
    } else if (tax.calculation_method === 'dpp_adjusted') {
      // PMK 131/2024 — DPP Nilai Lain = 11/12 × Harga Jual, PPN = DPP × 12%
      dpp = base / 1.11;
      ppn = dpp * rate;
    }
  }

  return {
    ...item,
    total: base.toFixed(2),
    dpp: dpp.toFixed(2),
    ppn: ppn.toFixed(2),
    grandTotal: (dpp + ppn).toFixed(2),
  };
}

export default function CreatePurchaseLocalPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PurchaseLocalContent />
    </Suspense>
  );
}

function PurchaseLocalContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const t = getLang(lang);
  const tr = t.purchase_local;

  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Company profile for Invoice Under
  const [companyProfile, setCompanyProfile] = useState<GetCompanyProfile | null>(null);

  // Master data
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);
  const [uomOptions, setUomOptions] = useState<UOMData[]>([]);
  const [taxOptions, setTaxOptions] = useState<GetTaxData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((c) => ({
      label: `${c.currency_code} — ${c.currency_name}`,
      value: c.currency_id,
    })),
  });

  const uomCollection = createListCollection({
    items: uomOptions.map((u) => ({ label: u.uom_name, value: u.uom_id })),
  });

  const taxCollection = createListCollection({
    items: taxOptions.map((tx) => ({
      label: `${tx.tax_name} (${tx.tax_rate}%)`,
      value: tx.tax_id,
    })),
  });

  // Item master — searchable combobox
  const [itemMasterAll, setItemMasterAll] = useState<GetItemData[]>([]);
  const { contains } = useFilter({ sensitivity: 'base' });
  const { collection: itemCollection, set: setItemCollection } =
    useListCollection<GetItemData>({
      initialItems: [],
      itemToString: (i) => `${i.item_code} — ${i.item_name}`,
      itemToValue: (i) => i.item_id,
    });

  // Payment method — searchable combobox
  const [paymentMasterAll, setPaymentMasterAll] = useState<GetPaymentMethodData[]>([]);
  const { collection: paymentCollection, set: setPaymentCollection } =
    useListCollection<GetPaymentMethodData>({
      initialItems: [],
      itemToString: (p) => p.payment_name,
      itemToValue: (p) => p.payment_id,
    });
  const [paymentSelected, setPaymentSelected] = useState('');
  const [paymentSelectedId, setPaymentSelectedId] = useState('');

  // Supplier lookup
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<GetSupplierData | null>(null);

  // Header form
  const [form, setForm] = useState({
    po_number: '',
    po_date: '',
    shipment_date: '',
    delivery_address: '',
    notes: '',
    exchange_rate_idr: ''
  });

  const [currencySelected, setCurrencySelected] = useState<string>();
  const [taxSelected, setTaxSelected] = useState<string>();

  const selectedTax = taxOptions.find((tx) => tx.tax_id === taxSelected);
  const selectedCurrencyCode =
    currencyOptions.find((c) => c.currency_id === currencySelected)?.currency_code ?? '';

  // Items
  const [items, setItems] = useState<PurchaseItem[]>([newItem()]);

  // Documents
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if (!valid) return;

        const info = getAuthInfo();
        setAuth(info);
        setLang(info?.language === 'id' ? 'id' : 'en');

        const [numberRes, currencyRes, uomRes, taxRes, paymentRes, itemRes] = await Promise.all([
          generatePurchaseLocalNumber(),
          getAllCurrency(1, 1000),
          getAllUOM(1, 1000),
          getAllTax(1, 1000),
          getAllPaymentMethod(1, 1000),
          getAllItem(1, 1000),
        ]);

        setForm((prev) => ({ ...prev, po_number: numberRes.number }));
        setCurrencyOptions(currencyRes?.data ?? []);
        setUomOptions(uomRes?.data ?? []);
        setTaxOptions(taxRes?.data ?? []);

        const paymentData = paymentRes?.data ?? [];
        setPaymentMasterAll(paymentData);
        setPaymentCollection(paymentData);

        const itemData = itemRes?.data ?? [];
        setItemMasterAll(itemData);
        setItemCollection(itemData);

        // Company profile — non-blocking
        try {
          const profile = await getCompanyProfile();
          setCompanyProfile(profile);
        } catch {
          // silently ignore if company profile not yet available
        }
      } catch (err) {
        console.error('Failed to initialize:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // Item handlers
  const handleItemChange = (id: string, field: keyof PurchaseItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        return calcItem(updated, selectedTax);
      })
    );
  };

  const handleItemSelect = (id: string, itemId: string) => {
    const found = itemMasterAll.find((i) => i.item_id === itemId);
    if (!found) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return calcItem(
          { ...item, itemId: found.item_id, description: found.item_name, uomId: found.default_uom ?? '' },
          selectedTax
        );
      })
    );
  };

  const handleTaxChange = (taxId: string) => {
    setTaxSelected(taxId);
    const tax = taxOptions.find((tx) => tx.tax_id === taxId);
    setItems((prev) => prev.map((item) => calcItem(item, tax)));
  };

  const addItem = () => setItems((prev) => [...prev, newItem()]);

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((i) => i.id !== id)));
  };

  // Footer totals
  const totalSubtotal = items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
  const totalPpn = items.reduce((s, i) => s + (parseFloat(i.ppn) || 0), 0);
  const totalGrand = items.reduce((s, i) => s + (parseFloat(i.grandTotal) || 0), 0);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Document handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setUploadedFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChooseSupplier = (supplier: GetSupplierData) => {
    setSelectedSupplier(supplier);
    setSupplierModalOpen(false);
  };

  const resetForm = async () => {
    const res = await generatePurchaseLocalNumber();
    setForm({ po_number: res.number, po_date: '', shipment_date: '', delivery_address: '', exchange_rate_idr: '0', notes: '' });
    setSelectedSupplier(null);
    setCurrencySelected(undefined);
    setTaxSelected(undefined);
    setPaymentSelected('');
    setPaymentSelectedId('');
    setItems([newItem()]);
    setUploadedFiles([]);
  };

  const handleSubmit = async (mode: 'draft' | 'submitted') => {
    try {
      if (!form.po_number) throw new Error(tr.error_po_number);
      if (!form.po_date) throw new Error(tr.error_po_date);
      if (!selectedSupplier?.supplier_id) throw new Error(tr.error_supplier);
      if (!form.shipment_date) throw new Error(tr.error_delivery_date);
      if (!paymentSelectedId) throw new Error(tr.error_payment);
      if (items.length === 0) throw new Error(tr.error_items);
      if (items.some((i) => !i.itemId)) throw new Error(tr.error_item_id);
      if (items.some((i) => Number(i.qty) <= 0)) throw new Error(tr.error_item_qty);
      if (items.some((i) => Number(i.unitPrice) <= 0)) throw new Error(tr.error_item_price);

      setLoading(true);

      await createPurchaseLocal({
        purchase_type: 'local',
        po_number: form.po_number,
        po_date: form.po_date,
        delivery_date: form.shipment_date,
        supplier_id: selectedSupplier.supplier_id,
        payment_id: paymentSelectedId,
        currency_id: currencySelected ?? '',
        tax_id: taxSelected ?? '',
        exchange_rate_idr: form.exchange_rate_idr,
        notes: form.notes,
        items: items.map(({ id: _id, ...rest }) => ({
          item_id: rest.itemId,
          qty: rest.qty,
          unit_price: rest.unitPrice,
          uom_id: rest.uomId,
          remarks: rest.remarks,
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
          <Button bg={BIZGEN_COLOR} color="white" onClick={() => handleSubmit('submitted')}>
            {tr.submit_purchase}
          </Button>
        </Flex>
      </Flex>

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

      <SupplierLookup
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onChoose={handleChooseSupplier}
      />

      <Stack gap={6}>
        {/* Purchase Details */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">{tr.purchase_details}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.po_number}<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={form.po_number}
                  onChange={(e) => setForm({ ...form, po_number: e.target.value })}
                  placeholder={tr.po_number_placeholder}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.po_date}<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="date"
                  value={form.po_date}
                  onChange={(e) => setForm({ ...form, po_date: e.target.value })}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.shipment_date}<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="date"
                  value={form.shipment_date}
                  onChange={(e) => setForm({ ...form, shipment_date: e.target.value })}
                />
              </Field.Root>

              {/* Supplier */}
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
                  <Text>{selectedSupplier?.supplier_origin ?? '—'}</Text>
                  <Text>{selectedSupplier?.supplier_currency ? `Currency: ${selectedSupplier.supplier_currency}` : '—'}</Text>
                  <Text>{selectedSupplier?.supplier_term ? `Term: ${selectedSupplier.supplier_term}` : '—'}</Text>
                </Box>
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

              {/* Exchange Rate IDR */}
              <Field.Root>
                <Field.Label fontSize="sm">{tr.exchange_rate_idr}</Field.Label>
                <Input
                  type="number"
                  value={form.exchange_rate_idr}
                  onChange={(e) => setForm({ ...form, exchange_rate_idr: e.target.value })}
                  placeholder="0"
                />
              </Field.Root>

              {/* Payment Method — searchable combobox */}
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.payment_method}<Field.RequiredIndicator /></Field.Label>
                <Combobox.Root
                  collection={paymentCollection}
                  onValueChange={(d) => {
                    const id = d.value?.[0] ?? '';
                    setPaymentSelectedId(id);
                    const found = paymentMasterAll.find((p) => p.payment_id === id);
                    setPaymentSelected(found?.payment_name ?? '');
                  }}
                  onInputValueChange={(e) => {
                    const input = e.inputValue ?? '';
                    setPaymentSelected(input);
                    if (!input.trim()) { setPaymentCollection(paymentMasterAll); return; }
                    setPaymentCollection(
                      paymentMasterAll.filter((p) => contains(p.payment_name, input))
                    );
                  }}
                >
                  <Combobox.Control>
                    <Combobox.Input
                      placeholder={tr.payment_method_placeholder}
                      value={paymentSelected}
                      onFocus={() => setPaymentCollection(paymentMasterAll)}
                    />
                    <Combobox.IndicatorGroup>
                      <Combobox.ClearTrigger onClick={() => { setPaymentSelected(''); setPaymentSelectedId(''); }} />
                      <Combobox.Trigger />
                    </Combobox.IndicatorGroup>
                  </Combobox.Control>
                  <Portal>
                    <Combobox.Positioner>
                      <Combobox.Content>
                        <Combobox.Empty>No payment methods found</Combobox.Empty>
                        {paymentCollection.items.map((p) => (
                          <Combobox.Item item={p} key={p.payment_id}>
                            {p.payment_name}<Combobox.ItemIndicator />
                          </Combobox.Item>
                        ))}
                      </Combobox.Content>
                    </Combobox.Positioner>
                  </Portal>
                </Combobox.Root>
              </Field.Root>

              {/* Tax */}
              <Field.Root>
                <Field.Label fontSize="sm">{tr.tax}</Field.Label>
                <Select.Root
                  collection={taxCollection}
                  value={taxSelected ? [taxSelected] : []}
                  onValueChange={(d) => handleTaxChange(d.value[0])}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={tr.tax_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {taxCollection.items.map((tx) => (
                          <Select.Item item={tx} key={tx.value}>{tx.label}<Select.ItemIndicator /></Select.Item>
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

        {/* Purchase Items */}
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Heading size="md">{tr.purchase_items}</Heading>
              <Button size="sm" bg={BIZGEN_COLOR} color="white" onClick={addItem}>
                {tr.add_item}
              </Button>
            </Flex>
          </Card.Header>
          <Card.Body>
            <Box overflowX="auto">
              {/* Column headers */}
              <Flex minW="1420px" gap={3} mb={2} px={1}>
                {[
                  ['32px', '#'],
                  ['220px', tr.description],
                  ['80px', tr.qty],
                  ['130px', tr.uom],
                  ['130px', tr.packaging_size],
                  ['140px', `${tr.unit_price}${selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}`],
                  ['140px', tr.item_total],
                  ['130px', tr.dpp],
                  ['130px', tr.ppn],
                  ['140px', tr.grand_total],
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
                <Flex key={item.id} minW="1420px" gap={3} mb={3} align="center" px={1}>
                  <Box w="32px" flexShrink={0}>
                    <Text fontSize="sm" color="gray.400">{idx + 1}</Text>
                  </Box>
                  <Box w="220px" flexShrink={0}>
                    <Combobox.Root
                      collection={itemCollection}
                      onValueChange={(d) => handleItemSelect(item.id, d.value?.[0] ?? '')}
                      onInputValueChange={(e) => {
                        const input = e.inputValue ?? '';
                        if (!input.trim()) { setItemCollection(itemMasterAll); return; }
                        setItemCollection(itemMasterAll.filter((i) =>
                          contains(i.item_name, input) || contains(i.item_code, input)
                        ));
                      }}
                    >
                      <Combobox.Control>
                        <Combobox.Input
                          placeholder={tr.description_placeholder}
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
                  <Box w="130px" flexShrink={0}>
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
                  <Box w="140px" flexShrink={0}>
                    <Input value={fmt(parseFloat(item.total) || 0)} readOnly bg="gray.50" />
                  </Box>
                  <Box w="130px" flexShrink={0}>
                    <Input value={fmt(parseFloat(item.dpp) || 0)} readOnly bg="gray.50" />
                  </Box>
                  <Box w="130px" flexShrink={0}>
                    <Input value={fmt(parseFloat(item.ppn) || 0)} readOnly bg="gray.50" />
                  </Box>
                  <Box w="140px" flexShrink={0}>
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
              <Flex justify="flex-end" minW="1420px" pr={1}>
                <Box w="420px">
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" color="gray.600">
                      {tr.subtotal}{selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}
                    </Text>
                    <Text fontSize="sm" fontWeight="semibold">{fmt(totalSubtotal)}</Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" color="gray.600">{tr.total_ppn}</Text>
                    <Text fontSize="sm" fontWeight="semibold">{fmt(totalPpn)}</Text>
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

        {/* Invoice Under + Delivery Address */}
        <Card.Root>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
              {/* Invoice Under — read-only company profile */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="wide">
                  {tr.invoice_under}
                </Text>
                {companyProfile ? (
                  <Box lineHeight="tall">
                    <Text fontWeight="bold" fontSize="sm">{companyProfile.company_name}</Text>
                    <Text fontSize="sm" color="gray.600" whiteSpace="pre-line">{companyProfile.company_address}</Text>
                    {companyProfile.company_phone && (
                      <Text fontSize="sm" color="gray.600">{companyProfile.company_phone}</Text>
                    )}
                  </Box>
                ) : (
                  <Text fontSize="sm" color="gray.400" fontStyle="italic">—</Text>
                )}
              </Box>

              {/* Delivery Address — editable */}
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide">
                  {tr.delivery_address}
                </Field.Label>
                <Textarea
                  rows={4}
                  value={form.delivery_address}
                  onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                  placeholder={tr.delivery_address_placeholder}
                  borderColor="gray.200"
                />
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* Document Upload */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">{tr.document}</Heading>
          </Card.Header>
          <Card.Body>
            {/* Upload zone */}
            <Flex
              border="1px dashed"
              borderColor="gray.300"
              borderRadius="lg"
              p={6}
              align="center"
              justify="center"
              direction="column"
              gap={2}
              textAlign="center"
              cursor="pointer"
              _hover={{ borderColor: BIZGEN_COLOR, bg: 'orange.50' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon as={FiUpload} boxSize={7} color="gray.400" />
              <Text fontSize="sm" color="gray.500">{tr.document_upload_hint}</Text>
              <Button size="sm" variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} pointerEvents="none">
                {tr.document_choose}
              </Button>
            </Flex>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFileChange}
            />

            {/* Uploaded file list */}
            {uploadedFiles.length > 0 && (
              <Stack mt={4} gap={2}>
                {uploadedFiles.map((file, idx) => (
                  <Flex
                    key={idx}
                    align="center"
                    justify="space-between"
                    px={3}
                    py={2}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                    bg="gray.50"
                  >
                    <Flex align="center" gap={2}>
                      <Icon as={FiFileText} color="gray.500" />
                      <Text fontSize="sm" color="gray.700">{file.name}</Text>
                      <Text fontSize="xs" color="gray.400">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </Text>
                    </Flex>
                    <IconButton
                      aria-label="Remove file"
                      variant="ghost"
                      size="xs"
                      color="red.400"
                      onClick={() => removeFile(idx)}
                    >
                      <FiX />
                    </IconButton>
                  </Flex>
                ))}
              </Stack>
            )}
          </Card.Body>
        </Card.Root>
      </Stack>

      <Flex justify="flex-end" gap={3} mt={6}>
        <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={() => handleSubmit('draft')}>
          {tr.save_draft}
        </Button>
        <Button bg={BIZGEN_COLOR} color="white" onClick={() => handleSubmit('submitted')}>
          {tr.submit_purchase}
        </Button>
      </Flex>
    </SidebarWithHeader>
  );
}
