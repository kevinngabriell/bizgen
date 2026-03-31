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
import { getAllPort, GetPortData } from '@/lib/master/port';
import { getAllPaymentMethod, GetPaymentMethodData } from '@/lib/master/payment-method';
import { getAllShipmentPeriod, GetShipmentPeriodData } from '@/lib/master/shipment-period';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { getAllUOM, UOMData } from '@/lib/master/uom';
import { GetSupplierData } from '@/lib/master/supplier';
import { createPurchaseImport, generatePurchaseImportNumber } from '@/lib/purchase/import';
import { Box, Button, Card, Combobox, createListCollection, Field, Flex, Heading, Icon, IconButton, Input, Portal, Select, Separator, SimpleGrid, Stack, Text, Textarea, useFilter, useListCollection } from '@chakra-ui/react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { FiFileText, FiUpload, FiX } from 'react-icons/fi';

const BIZGEN_COLOR = '#E77A1F';

type ImportItem = {
  id: string;
  itemId: string;
  description: string;
  qty: string;
  uomId: string;
  packageSize: string;
  unitPrice: string;
  total: string;
  remarks: string;
};

function newItem(): ImportItem {
  return {
    id: crypto.randomUUID(),
    itemId: '', description: '', qty: '', uomId: '', packageSize: '',
    unitPrice: '', total: '0', remarks: '',
  };
}

function calcTotal(item: ImportItem): ImportItem {
  const qty = parseFloat(item.qty) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  return { ...item, total: (qty * price).toFixed(2) };
}

export default function CreatePurchaseImportPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PurchaseImportContent />
    </Suspense>
  );
}

function PurchaseImportContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const t = getLang(lang);
  const tr = t.purchase_import;

  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Company profile for Should Mention
  const [companyProfile, setCompanyProfile] = useState<GetCompanyProfile | null>(null);

  // Master data
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);
  const [uomOptions, setUomOptions] = useState<UOMData[]>([]);
  const [portOptions, setPortOptions] = useState<GetPortData[]>([]);
  const [termOptions, setTermOptions] = useState<GetTermData[]>([]);
  const [shipmentPeriodOptions, setShipmentPeriodOptions] = useState<GetShipmentPeriodData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((c) => ({
      label: `${c.currency_code} — ${c.currency_name}`,
      value: c.currency_id,
    })),
  });

  const uomCollection = createListCollection({
    items: uomOptions.map((u) => ({ label: u.uom_name, value: u.uom_id })),
  });

  const portCollection = createListCollection({
    items: portOptions.map((p) => ({ label: `${p.port_name} — ${p.origin_name}`, value: p.port_id })),
  });

  const termCollection = createListCollection({
    items: termOptions.map((tm) => ({ label: tm.term_name, value: tm.term_id })),
  });

  const shipmentPeriodCollection = createListCollection({
    items: shipmentPeriodOptions.map((sp) => ({
      label: sp.shipment_period_name,
      value: sp.shipment_period_id,
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
    exchange_rate: '',
    notes: '',
    shipping_marks: '',
    consignee_remarks: '',
  });

  const [currencySelected, setCurrencySelected] = useState<string>();
  const [originSelected, setOriginSelected] = useState<string>();
  const [destinationSelected, setDestinationSelected] = useState<string>();
  const [termSelected, setTermSelected] = useState<string>();
  const [shipmentPeriodSelected, setShipmentPeriodSelected] = useState<string>();

  const selectedCurrencyCode =
    currencyOptions.find((c) => c.currency_id === currencySelected)?.currency_code ?? '';

  // Items
  const [items, setItems] = useState<ImportItem[]>([newItem()]);

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

        const [numberRes, currencyRes, uomRes, portRes, termRes, shipPeriodRes, paymentRes, itemRes] =
          await Promise.all([
            generatePurchaseImportNumber(),
            getAllCurrency(1, 1000),
            getAllUOM(1, 1000),
            getAllPort(1, 1000),
            getAllTerm(1, 1000),
            getAllShipmentPeriod(1, 1000),
            getAllPaymentMethod(1, 1000),
            getAllItem(1, 1000),
          ]);

        setForm((prev) => ({ ...prev, po_number: numberRes.number }));
        setCurrencyOptions(currencyRes?.data ?? []);
        setUomOptions(uomRes?.data ?? []);
        setPortOptions(portRes?.data ?? []);
        setTermOptions(termRes?.data ?? []);
        setShipmentPeriodOptions(shipPeriodRes?.data ?? []);

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
          // silently ignore if not yet available
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
  const handleItemChange = (id: string, field: keyof ImportItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return calcTotal({ ...item, [field]: value });
      })
    );
  };

  const handleItemSelect = (id: string, itemId: string) => {
    const found = itemMasterAll.find((i) => i.item_id === itemId);
    if (!found) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return calcTotal({ ...item, itemId: found.item_id, description: found.item_name, uomId: found.default_uom ?? '' });
      })
    );
  };

  const addItem = () => setItems((prev) => [...prev, newItem()]);

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((i) => i.id !== id)));
  };

  // Footer totals
  const totalGrand = items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);

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
    const res = await generatePurchaseImportNumber();
    setForm({ po_number: res.number, po_date: '', exchange_rate: '', notes: '', shipping_marks: '', consignee_remarks: '' });
    setSelectedSupplier(null);
    setCurrencySelected(undefined);
    setOriginSelected(undefined);
    setDestinationSelected(undefined);
    setTermSelected(undefined);
    setShipmentPeriodSelected(undefined);
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
      if (!shipmentPeriodSelected) throw new Error(tr.error_shipment_period);
      if (!termSelected) throw new Error(tr.error_term);
      if (!paymentSelectedId) throw new Error(tr.error_payment_method);
      if (!originSelected) throw new Error(tr.error_origin);
      if (!destinationSelected) throw new Error(tr.error_destination);
      if (!currencySelected) throw new Error(tr.error_currency);
      if (!form.exchange_rate || Number(form.exchange_rate) <= 0) throw new Error(tr.error_exchange_rate);
      if (items.length === 0) throw new Error(tr.error_items);
      if (items.some((i) => !i.itemId)) throw new Error(tr.error_item_id);
      if (items.some((i) => Number(i.qty) <= 0)) throw new Error(tr.error_item_qty);
      if (items.some((i) => Number(i.unitPrice) <= 0)) throw new Error(tr.error_item_price);

      setLoading(true);

      await createPurchaseImport({
        purchase_type: 'import',
        po_number: form.po_number,
        po_date: form.po_date,
        supplier_id: selectedSupplier.supplier_id,
        shipment_period_id: shipmentPeriodSelected,
        term_id: termSelected,
        payment_method_id: paymentSelectedId,
        origin_id: originSelected,
        destination_id: destinationSelected,
        currency_id: currencySelected,
        exchange_rate_to_idr: form.exchange_rate,
        notes: form.notes,
        items: items.map(({ id: _id, ...rest }) => ({
          item_id: rest.itemId,
          description: rest.description,
          qty: rest.qty,
          uom_id: rest.uomId,
          packaging_size: rest.packageSize,
          unit_price: rest.unitPrice,
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
                  <Text>{selectedSupplier?.origin_name ?? '—'}</Text>
                  <Text>{selectedSupplier?.currency_name ? `Currency: ${selectedSupplier.currency_name}` : '—'}</Text>
                  <Text>{selectedSupplier?.term_name ? `Term: ${selectedSupplier.term_name}` : '—'}</Text>
                </Box>
              </Field.Root>

              {/* Shipment Period */}
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.shipment_period}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  collection={shipmentPeriodCollection}
                  value={shipmentPeriodSelected ? [shipmentPeriodSelected] : []}
                  onValueChange={(d) => setShipmentPeriodSelected(d.value[0])}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={tr.shipment_period_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {shipmentPeriodCollection.items.map((sp) => (
                          <Select.Item item={sp} key={sp.value}>{sp.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>

              {/* Incoterm */}
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.term}<Field.RequiredIndicator /></Field.Label>
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

              {/* Origin Port */}
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.origin_port}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  collection={portCollection}
                  value={originSelected ? [originSelected] : []}
                  onValueChange={(d) => setOriginSelected(d.value[0])}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={tr.origin_port_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {portCollection.items.map((p) => (
                          <Select.Item item={p} key={p.value}>{p.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>

              {/* Destination Port */}
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.destination_port}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  collection={portCollection}
                  value={destinationSelected ? [destinationSelected] : []}
                  onValueChange={(d) => setDestinationSelected(d.value[0])}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={tr.destination_port_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {portCollection.items.map((p) => (
                          <Select.Item item={p} key={p.value}>{p.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>

              {/* Currency */}
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.currency}<Field.RequiredIndicator /></Field.Label>
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
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.exchange_rate}<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="number"
                  value={form.exchange_rate}
                  onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })}
                  placeholder={tr.exchange_rate_placeholder}
                />
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
              <Flex minW="1260px" gap={3} mb={2} px={1}>
                {[
                  ['32px', '#'],
                  ['220px', tr.description],
                  ['80px', tr.qty],
                  ['120px', tr.uom],
                  ['140px', tr.packaging_size],
                  ['140px', `${tr.unit_price}${selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}`],
                  ['140px', tr.item_total],
                  ['120px', tr.remarks],
                  ['40px', ''],
                ].map(([w, label], i) => (
                  <Box key={i} w={w} flexShrink={0}>
                    <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{label}</Text>
                  </Box>
                ))}
              </Flex>

              {/* Item rows */}
              {items.map((item, idx) => (
                <Flex key={item.id} minW="1260px" gap={3} mb={3} align="center" px={1}>
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
                  <Box w="120px" flexShrink={0}>
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
                  <Box w="140px" flexShrink={0}>
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
                    <Input value={fmt(parseFloat(item.total) || 0)} readOnly bg="gray.50" fontWeight="semibold" />
                  </Box>
                  <Box w="120px" flexShrink={0}>
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

              {/* Grand total footer */}
              <Separator mt={2} mb={4} />
              <Flex justify="flex-end" minW="1260px" pr={1}>
                <Box w="300px">
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

        {/* Consignee Details */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">{tr.consignee_details}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
              {/* Should Mention — read-only from company profile */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="wide">
                  {tr.should_mention}
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

              {/* Shipping Marks */}
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide">
                  {tr.shipping_marks}
                </Field.Label>
                <Textarea
                  rows={4}
                  value={form.shipping_marks}
                  onChange={(e) => setForm({ ...form, shipping_marks: e.target.value })}
                  placeholder={tr.shipping_marks_placeholder}
                  borderColor="gray.200"
                />
              </Field.Root>

              {/* Remarks */}
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide">
                  {tr.consignee_remarks}
                </Field.Label>
                <Textarea
                  rows={4}
                  value={form.consignee_remarks}
                  onChange={(e) => setForm({ ...form, consignee_remarks: e.target.value })}
                  placeholder={tr.consignee_remarks_placeholder}
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
                      <Text fontSize="xs" color="gray.400">({(file.size / 1024).toFixed(1)} KB)</Text>
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
