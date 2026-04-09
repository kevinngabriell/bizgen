'use client';

import Loading from '@/components/loading';
import PurchaseOrderLookup, { PurchaseOrderEntry } from '@/components/lookup/PurchaseOrderLookup';
import SupplierLookup from '@/components/lookup/SupplierLookup';
import RejectDialog from '@/components/dialog/RejectDialog';
import { AlertMessage } from '@/components/ui/alert';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { SALES_APPROVAL_ROLES, checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { getAllCurrency, GetCurrencyData } from '@/lib/master/currency';
import { getAllItem, GetItemData } from '@/lib/master/item';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { getAllUOM, UOMData } from '@/lib/master/uom';
import { GetSupplierData } from '@/lib/master/supplier';
import {
  createPurchaseInvoice,
  generatePurchaseInvoiceNumber,
  getPurchaseInvoiceDetail,
  updatePurchaseInvoice,
  processPurchaseInvoiceAction,
  GetPurchaseInvoiceHistoryDetailData,
} from '@/lib/purchase/invoice';
import {
  Badge, Box, Button, Card, Combobox, createListCollection,
  Field, Flex, Heading, IconButton, Input, Portal,
  Select, Separator, SimpleGrid, Stack, Text, Textarea,
  useFilter, useListCollection,
} from '@chakra-ui/react';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaTrash } from 'react-icons/fa';

const BIZGEN_COLOR = '#E77A1F';

type InvoiceMode = 'create' | 'view';

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
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoice_id');

  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const t = getLang(lang);
  const tr = t.purchase_invoice;

  const canApprove = SALES_APPROVAL_ROLES.has(auth?.app_role_id ?? '');

  const [mode, setMode] = useState<InvoiceMode>('create');
  const [invId, setInvId] = useState('');
  const [invStatus, setInvStatus] = useState('');
  const [historyData, setHistoryData] = useState<GetPurchaseInvoiceHistoryDetailData[]>([]);
  const [poLocalId, setPoLocalId] = useState('');
  const [poImportId, setPoImportId] = useState('');

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const showSuccess = (msg: string) => {
    setShowAlert(true); setIsSuccess(true);
    setTitlePopup(t.master.success); setMessagePopup(msg);
    setTimeout(() => setShowAlert(false), 6000);
  };
  const showError = (msg: string) => {
    setShowAlert(true); setIsSuccess(false);
    setTitlePopup(t.master.error); setMessagePopup(msg);
    setTimeout(() => setShowAlert(false), 6000);
  };

  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);
  const [uomOptions, setUomOptions] = useState<UOMData[]>([]);
  const [termOptions, setTermOptions] = useState<GetTermData[]>([]);
  const [itemMasterAll, setItemMasterAll] = useState<GetItemData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((c) => ({ label: `${c.currency_code} — ${c.currency_name}`, value: c.currency_id })),
  });
  const uomCollection = createListCollection({
    items: uomOptions.map((u) => ({ label: u.uom_name, value: u.uom_id })),
  });
  const termCollection = createListCollection({
    items: termOptions.map((tm) => ({ label: tm.term_name, value: tm.term_id })),
  });

  const { contains } = useFilter({ sensitivity: 'base' });
  const { collection: itemCollection, set: setItemCollection } = useListCollection<GetItemData>({
    initialItems: [],
    itemToString: (i) => `${i.item_code} — ${i.item_name}`,
    itemToValue: (i) => i.item_id,
  });

  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<GetSupplierData | null>(null);

  const [poLookupOpen, setPoLookupOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderEntry | null>(null);
  const purchaseOrderLocalId = selectedPO?.purchase_type === 'local' ? (selectedPO as any).purchase_id : poLocalId;
  const purchaseOrderImportId = selectedPO?.purchase_type === 'import' ? (selectedPO as any).purchase_import_id : poImportId;

  const [currencySelected, setCurrencySelected] = useState<string>();
  const [termSelected, setTermSelected] = useState<string>();

  const [form, setForm] = useState({
    invoice_number: '',
    po_number: '',
    invoice_date: '',
    ship_date: '',
    exchange_rate: '',
    notes: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([newItem()]);

  // Invoice: read-only only when posted; cancelled is re-editable
  const isReadOnly = mode === 'view' && invStatus === 'posted';

  const selectedCurrencyCode = currencyOptions.find((c) => c.currency_id === currencySelected)?.currency_code ?? '';

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if (!valid) return;

        const info = getAuthInfo();
        setAuth(info);
        setLang(info?.language === 'id' ? 'id' : 'en');

        const [currencyRes, uomRes, termRes, itemRes] = await Promise.all([
          getAllCurrency(1, 1000),
          getAllUOM(1, 1000),
          getAllTerm(1, 1000),
          getAllItem(1, 1000),
        ]);

        const currencyData = currencyRes?.data ?? [];
        const uomData = uomRes?.data ?? [];
        const termData = termRes?.data ?? [];
        const itemData = itemRes?.data ?? [];

        setCurrencyOptions(currencyData);
        setUomOptions(uomData);
        setTermOptions(termData);
        setItemMasterAll(itemData);
        setItemCollection(itemData);

        if (invoiceId) {
          setMode('view');
          const detail = await getPurchaseInvoiceDetail(invoiceId);
          const h = detail.header;

          setInvId(h.purchase_invoice_id);
          setInvStatus(h.status);
          setHistoryData(detail.history);
          setPoLocalId(h.purchase_id_local ?? '');
          setPoImportId(h.purchase_id_import ?? '');

          setForm((prev) => ({
            ...prev,
            invoice_number: h.invoice_number,
            po_number: h.po_number ?? '',
            invoice_date: h.invoice_date,
            ship_date: h.due_date ?? '',
            exchange_rate: h.exchange_rate_to_idr ?? '',
            notes: h.notes ?? '',
          }));

          const currency = currencyData.find((c) => c.currency_code === h.currency_code);
          if (currency) setCurrencySelected(currency.currency_id);

          const term = termData.find((tm) => tm.term_name === h.term_name);
          if (term) setTermSelected(term.term_id);

          setSelectedSupplier({ supplier_name: h.supplier_name } as GetSupplierData);

          setItems(
            detail.items.map((item) => {
              const uom = uomData.find((u) => u.uom_name === item.uom_name);
              const qty = item.quantity ?? '0';
              const price = item.unit_price ?? '0';
              const vatPct = item.tax_percent ?? '0';
              const total = (parseFloat(qty) * parseFloat(price));
              const vatAmount = total * (parseFloat(vatPct) / 100);
              return {
                id: crypto.randomUUID(),
                itemId: item.item_id,
                description: item.item_name,
                qty,
                uomId: uom?.uom_id ?? '',
                packageSize: '',
                unitPrice: price,
                total: total.toFixed(2),
                vatPercent: vatPct,
                vatAmount: vatAmount.toFixed(2),
                grandTotal: (total + vatAmount).toFixed(2),
                remarks: item.notes ?? '',
              };
            })
          );
        } else {
          const numberRes = await generatePurchaseInvoiceNumber();
          setForm((prev) => ({ ...prev, invoice_number: numberRes.number }));
        }
      } catch (err) {
        console.error('Failed to initialize:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [invoiceId]);

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
        return calcItem({ ...item, itemId: found.item_id, description: found.item_name, uomId: found.default_uom ?? '' });
      })
    );
  };

  const addItem = () => setItems((prev) => [...prev, newItem()]);
  const removeItem = (id: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((i) => i.id !== id)));
  };

  const totalSubtotal = items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
  const totalVat = items.reduce((s, i) => s + (parseFloat(i.vatAmount) || 0), 0);
  const totalGrand = items.reduce((s, i) => s + (parseFloat(i.grandTotal) || 0), 0);
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleChooseSupplier = (supplier: GetSupplierData) => {
    setSelectedSupplier(supplier);
    setSupplierModalOpen(false);
  };

  const handleChoosePO = (entry: PurchaseOrderEntry) => {
    setSelectedPO(entry);
    setPoLookupOpen(false);
  };

  const buildPayloadItems = () =>
    items.map(({ id: _id, ...rest }) => ({
      item_id: rest.itemId,
      uom_id: rest.uomId,
      quantity: Number(rest.qty),
      unit_price: Number(rest.unitPrice),
      tax_percent: Number(rest.vatPercent),
      notes: rest.remarks,
    }));

  const validateForm = () => {
    if (!form.invoice_number) throw new Error(tr.error_invoice_number);
    if (!selectedSupplier?.supplier_id) throw new Error(tr.error_supplier);
    if (!form.invoice_date) throw new Error(tr.error_invoice_date);
    if (items.length === 0) throw new Error(tr.error_items);
    if (items.some((i) => !i.itemId)) throw new Error(tr.error_item_id);
    if (items.some((i) => Number(i.qty) <= 0)) throw new Error(tr.error_item_qty);
    if (items.some((i) => Number(i.unitPrice) <= 0)) throw new Error(tr.error_item_price);
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

  const handleSaveDraft = async () => {
    try {
      validateForm();
      setLoading(true);
      await createPurchaseInvoice({
        invoice_number: form.invoice_number,
        supplier_id: selectedSupplier!.supplier_id,
        invoice_date: form.invoice_date,
        purchase_order_local_id: purchaseOrderLocalId || undefined,
        purchase_order_import_id: purchaseOrderImportId || undefined,
        due_date: form.ship_date,
        term_id: termSelected,
        currency_id: currencySelected,
        exchange_rate_to_idr: Number(form.exchange_rate) || undefined,
        notes: form.notes,
        items: buildPayloadItems(),
      });
      showSuccess(tr.success_draft);
      await resetForm();
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndApprove = async () => {
    try {
      validateForm();
      setLoading(true);
      const res = await createPurchaseInvoice({
        invoice_number: form.invoice_number,
        supplier_id: selectedSupplier!.supplier_id,
        invoice_date: form.invoice_date,
        purchase_order_local_id: purchaseOrderLocalId || undefined,
        purchase_order_import_id: purchaseOrderImportId || undefined,
        due_date: form.ship_date,
        term_id: termSelected,
        currency_id: currencySelected,
        exchange_rate_to_idr: Number(form.exchange_rate) || undefined,
        notes: form.notes,
        items: buildPayloadItems(),
      });
      const newId = res?.data?.purchase_invoice_id ?? res?.purchase_invoice_id ?? '';
      if (newId) {
        await processPurchaseInvoiceAction({ purchase_invoice_id: newId, action: 'approve' });
      }
      showSuccess(tr.post_invoice);
      await resetForm();
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updatePurchaseInvoice({
        purchase_invoice_id: invId,
        supplier_id: selectedSupplier?.supplier_id,
        purchase_order_local_id: poLocalId || undefined,
        purchase_order_import_id: poImportId || undefined,
        invoice_date: form.invoice_date,
        due_date: form.ship_date,
        term_id: termSelected,
        currency_id: currencySelected,
        exchange_rate_to_idr: Number(form.exchange_rate) || undefined,
        notes: form.notes,
        items: buildPayloadItems(),
      });
      setInvStatus('draft');
      showSuccess(tr.success_draft);
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await processPurchaseInvoiceAction({ purchase_invoice_id: invId, action: 'approve' });
      setInvStatus('posted');
      showSuccess('Invoice approved and posted.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      setRejectLoading(true);
      await processPurchaseInvoiceAction({ purchase_invoice_id: invId, action: 'reject', notes: reason });
      setInvStatus('cancelled');
      setIsRejectDialogOpen(false);
      showSuccess('Invoice rejected.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setRejectLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; colorPalette: string }> = {
      draft:     { label: 'Draft',     colorPalette: 'yellow' },
      posted:    { label: 'Posted',    colorPalette: 'green'  },
      cancelled: { label: 'Cancelled', colorPalette: 'red'    },
    };
    const s = map[status] ?? { label: status, colorPalette: 'gray' };
    return <Badge colorPalette={s.colorPalette} variant="subtle" ml={3}>{s.label}</Badge>;
  };

  const ActionButtons = () => {
    if (mode === 'create') {
      return (
        <Flex gap={3}>
          <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={handleSaveDraft} loading={loading}>
            {tr.save_draft}
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={handleCreateAndApprove} loading={loading}>
            {tr.post_invoice}
          </Button>
        </Flex>
      );
    }
    if (invStatus === 'draft' || invStatus === 'cancelled') {
      return (
        <Flex gap={3}>
          <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={handleUpdate} loading={loading}>
            Update
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={handleApprove} loading={loading}>
            {tr.post_invoice}
          </Button>
        </Flex>
      );
    }
    return null;
  };

  if (loading && mode === 'create') return <Loading />;

  return (
    <SidebarWithHeader username={auth?.username ?? 'Unknown'} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between" align="center" mb={6}>
        <Flex flexDir="column">
          <Flex align="center">
            <Heading size="lg">{tr.title}</Heading>
            {mode === 'view' && statusBadge(invStatus)}
          </Flex>
          <Text color="gray.500" fontSize="sm">{tr.subtitle}</Text>
        </Flex>
        <ActionButtons />
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

      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleReject}
        loading={rejectLoading}
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
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label fontSize="sm">{tr.supplier}<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={selectedSupplier?.supplier_name ?? ''}
                  readOnly
                  cursor={isReadOnly ? 'default' : 'pointer'}
                  placeholder={tr.supplier_placeholder}
                  onClick={() => !isReadOnly && setSupplierModalOpen(true)}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{tr.supplier_info}</Field.Label>
                <Box fontSize="xs" color="gray.500" lineHeight="short" pt={1}>
                  <Text>{selectedSupplier?.origin_name ?? '—'}</Text>
                  <Text>{selectedSupplier?.currency_name ? `Currency: ${selectedSupplier.currency_name}` : '—'}</Text>
                  <Text>{selectedSupplier?.term_name ? `Term: ${selectedSupplier.term_name}` : '—'}</Text>
                </Box>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{tr.po_number}</Field.Label>
                <Input
                  value={selectedPO ? `[${selectedPO.purchase_type.toUpperCase()}] ${selectedPO.po_number}` :
                    (form.po_number || (poLocalId ? `[LOCAL] ${poLocalId}` : poImportId ? `[IMPORT] ${poImportId}` : ''))}
                  readOnly
                  cursor={isReadOnly ? 'default' : 'pointer'}
                  placeholder={tr.po_number_placeholder}
                  onClick={() => !isReadOnly && setPoLookupOpen(true)}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label fontSize="sm">{tr.invoice_date}<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="date"
                  value={form.invoice_date}
                  onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{tr.ship_date}</Field.Label>
                <Input
                  type="date"
                  value={form.ship_date}
                  onChange={(e) => setForm({ ...form, ship_date: e.target.value })}
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{tr.currency}</Field.Label>
                <Select.Root
                  collection={currencyCollection}
                  value={currencySelected ? [currencySelected] : []}
                  onValueChange={(d) => setCurrencySelected(d.value[0])}
                  disabled={isReadOnly}
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

              <Field.Root>
                <Field.Label fontSize="sm">{tr.exchange_rate}</Field.Label>
                <Input
                  type="number"
                  value={form.exchange_rate}
                  onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })}
                  placeholder={tr.exchange_rate_placeholder}
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{tr.term}</Field.Label>
                <Select.Root
                  collection={termCollection}
                  value={termSelected ? [termSelected] : []}
                  onValueChange={(d) => setTermSelected(d.value[0])}
                  disabled={isReadOnly}
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
                readOnly={isReadOnly}
              />
            </Field.Root>
          </Card.Body>
        </Card.Root>

        {/* Invoice Items */}
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Heading size="md">{tr.invoice_items}</Heading>
              {!isReadOnly && (
                <Button size="sm" bg={BIZGEN_COLOR} color="white" onClick={addItem}>
                  {tr.add_item}
                </Button>
              )}
            </Flex>
          </Card.Header>
          <Card.Body>
            <Box overflowX="auto">
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

              {items.map((item, idx) => (
                <Flex key={item.id} minW="1500px" gap={3} mb={3} align="center" px={1}>
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
                      disabled={isReadOnly}
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
                                {i.item_code} — {i.item_name}<Combobox.ItemIndicator />
                              </Combobox.Item>
                            ))}
                          </Combobox.Content>
                        </Combobox.Positioner>
                      </Portal>
                    </Combobox.Root>
                  </Box>
                  <Box w="80px" flexShrink={0}>
                    <Input type="number" placeholder="0" value={item.qty}
                      onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} readOnly={isReadOnly} />
                  </Box>
                  <Box w="110px" flexShrink={0}>
                    <Select.Root
                      collection={uomCollection}
                      value={item.uomId ? [item.uomId] : []}
                      onValueChange={(d) => handleItemChange(item.id, 'uomId', d.value[0])}
                      width="100%"
                      disabled={isReadOnly}
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
                    <Input placeholder={tr.packaging_size_placeholder} value={item.packageSize}
                      onChange={(e) => handleItemChange(item.id, 'packageSize', e.target.value)} readOnly={isReadOnly} />
                  </Box>
                  <Box w="140px" flexShrink={0}>
                    <Input type="number" placeholder="0" value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)} readOnly={isReadOnly} />
                  </Box>
                  <Box w="120px" flexShrink={0}>
                    <Input value={fmt(parseFloat(item.total) || 0)} readOnly bg="gray.50" />
                  </Box>
                  <Box w="80px" flexShrink={0}>
                    <Input type="number" placeholder="0" value={item.vatPercent}
                      onChange={(e) => handleItemChange(item.id, 'vatPercent', e.target.value)} readOnly={isReadOnly} />
                  </Box>
                  <Box w="110px" flexShrink={0}>
                    <Input value={fmt(parseFloat(item.vatAmount) || 0)} readOnly bg="gray.50" />
                  </Box>
                  <Box w="130px" flexShrink={0}>
                    <Input value={fmt(parseFloat(item.grandTotal) || 0)} readOnly bg="gray.50" fontWeight="semibold" />
                  </Box>
                  <Box w="110px" flexShrink={0}>
                    <Input placeholder={tr.remarks_placeholder} value={item.remarks}
                      onChange={(e) => handleItemChange(item.id, 'remarks', e.target.value)} readOnly={isReadOnly} />
                  </Box>
                  <Box w="40px" flexShrink={0}>
                    {!isReadOnly && (
                      <IconButton aria-label="Remove item" variant="ghost" color="red.500" size="sm" onClick={() => removeItem(item.id)}>
                        <FaTrash />
                      </IconButton>
                    )}
                  </Box>
                </Flex>
              ))}

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

        {/* History */}
        {mode === 'view' && historyData.length > 0 && (
          <Card.Root>
            <Card.Header>
              <Heading size="md">History</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={3}>
                {historyData.map((h, idx) => (
                  <Flex key={idx} gap={3} align="flex-start">
                    <Box minW="8px" h="8px" mt="6px" borderRadius="full" bg={BIZGEN_COLOR} />
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" textTransform="capitalize">{h.action}</Text>
                      {h.note && <Text fontSize="xs" color="gray.500">{h.note}</Text>}
                      <Text fontSize="xs" color="gray.400">{h.created_by} · {new Date(h.created_at).toLocaleString()}</Text>
                    </Box>
                  </Flex>
                ))}
              </Stack>
            </Card.Body>
          </Card.Root>
        )}
      </Stack>

      <Flex justify="flex-end" gap={3} mt={6}>
        <ActionButtons />
      </Flex>
    </SidebarWithHeader>
  );
}
