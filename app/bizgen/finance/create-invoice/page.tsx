'use client';

import Loading from '@/components/loading';
import SupplierLookup from '@/components/lookup/SupplierLookup';
import PurchaseOrderLookup, { PurchaseOrderEntry } from '@/components/lookup/PurchaseOrderLookup';
import RejectDialog from '@/components/dialog/RejectDialog';
import { AlertMessage } from '@/components/ui/alert';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { SALES_APPROVAL_ROLES, checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { getAllCurrency, GetCurrencyData } from '@/lib/master/currency';
import { getAllItem, GetItemData } from '@/lib/master/item';
import { getAllPort, GetPortData } from '@/lib/master/port';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { getAllUOM, UOMData } from '@/lib/master/uom';
import { GetSupplierData } from '@/lib/master/supplier';
import {
  Badge, Box, Button, Card, Checkbox, Combobox, createListCollection,
  Field, Flex, Heading, Icon, IconButton, Input, Portal,
  Select, Separator, SimpleGrid, Stack, Text, Textarea,
  useFilter, useListCollection,
} from '@chakra-ui/react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaTrash } from 'react-icons/fa';
import { FiFileText, FiUpload, FiX } from 'react-icons/fi';

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

type PaymentInstallment = {
  id: string;
  dueDate: string;
  amount: string;
  isPaid: boolean;
  paidDate: string;
  notes: string;
};

type HistoryEntry = {
  action: string;
  note?: string;
  created_by: string;
  created_at: string;
};

function newItem(): InvoiceItem {
  return {
    id: crypto.randomUUID(),
    itemId: '', description: '', qty: '', uomId: '', packageSize: '',
    unitPrice: '', total: '0', vatPercent: '0', vatAmount: '0', grandTotal: '0', remarks: '',
  };
}

function newInstallment(): PaymentInstallment {
  return { id: crypto.randomUUID(), dueDate: '', amount: '', isPaid: false, paidDate: '', notes: '' };
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

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={<Loading />}>
      <CreateInvoiceContent />
    </Suspense>
  );
}

function CreateInvoiceContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoice_id');

  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const t = getLang(lang);

  const canApprove = SALES_APPROVAL_ROLES.has(auth?.app_role_id ?? '');

  const [mode, setMode] = useState<InvoiceMode>('create');
  const [invStatus, setInvStatus] = useState('');
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);

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

  // Master data
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);
  const [uomOptions, setUomOptions] = useState<UOMData[]>([]);
  const [termOptions, setTermOptions] = useState<GetTermData[]>([]);
  const [portOptions, setPortOptions] = useState<GetPortData[]>([]);
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
  const portCollection = createListCollection({
    items: portOptions.map((p) => ({ label: `${p.port_name} — ${p.origin_name}`, value: p.port_id })),
  });

  const { contains } = useFilter({ sensitivity: 'base' });
  const { collection: itemCollection, set: setItemCollection } = useListCollection<GetItemData>({
    initialItems: [],
    itemToString: (i) => `${i.item_code} — ${i.item_name}`,
    itemToValue: (i) => i.item_id,
  });

  // Lookups
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<GetSupplierData | null>(null);
  const [poLookupOpen, setPoLookupOpen] = useState(false);

  // Form
  const [form, setForm] = useState({
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    po_number: '',
    exchange_rate: '',
    notes: '',
    vessel_flight: '',
    bl_awb_number: '',
    etd: '',
    eta: '',
  });

  const [currencySelected, setCurrencySelected] = useState<string>();
  const [termSelected, setTermSelected] = useState<string>();
  const [originSelected, setOriginSelected] = useState<string>();
  const [destinationSelected, setDestinationSelected] = useState<string>();

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>([newItem()]);

  // Payment schedule (cicilan)
  const [useInstallments, setUseInstallments] = useState(false);
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);

  // Document upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const isReadOnly = mode === 'view' && (invStatus === 'posted' || invStatus === 'submitted');
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

        const [currencyRes, uomRes, termRes, portRes, itemRes] = await Promise.all([
          getAllCurrency(1, 1000),
          getAllUOM(1, 1000),
          getAllTerm(1, 1000),
          getAllPort(1, 1000),
          getAllItem(1, 1000),
        ]);

        setCurrencyOptions(currencyRes?.data ?? []);
        setUomOptions(uomRes?.data ?? []);
        setTermOptions(termRes?.data ?? []);
        setPortOptions(portRes?.data ?? []);
        const itemData = itemRes?.data ?? [];
        setItemMasterAll(itemData);
        setItemCollection(itemData);

        if (!invoiceId) {
          // TODO: replace with generateInvoiceNumber() when API is available
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          setForm((prev) => ({ ...prev, invoice_number: `INV/${year}/${month}/` }));
        } else {
          setMode('view');
          // TODO: load invoice detail from API
        }
      } catch (err) {
        console.error('Failed to initialize:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [invoiceId]);

  // ─── Item handlers ─────────────────────────────────────────────────────────

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => item.id !== id ? item : calcItem({ ...item, [field]: value }))
    );
  };

  const handleItemSelect = (id: string, itemId: string) => {
    const found = itemMasterAll.find((i) => i.item_id === itemId);
    if (!found) return;
    setItems((prev) =>
      prev.map((item) => item.id !== id ? item :
        calcItem({ ...item, itemId: found.item_id, description: found.item_name, uomId: found.default_uom ?? '' })
      )
    );
  };

  const addItem = () => setItems((prev) => [...prev, newItem()]);
  const removeItem = (id: string) => setItems((prev) => prev.length === 1 ? prev : prev.filter((i) => i.id !== id));

  // ─── Installment handlers ──────────────────────────────────────────────────

  const addInstallment = () => setInstallments((prev) => [...prev, newInstallment()]);
  const removeInstallment = (id: string) => setInstallments((prev) => prev.filter((i) => i.id !== id));
  const updateInstallment = (id: string, field: keyof PaymentInstallment, value: any) => {
    setInstallments((prev) => prev.map((i) => i.id !== id ? i : { ...i, [field]: value }));
  };

  // ─── Totals ────────────────────────────────────────────────────────────────

  const totalSubtotal = items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
  const totalVat = items.reduce((s, i) => s + (parseFloat(i.vatAmount) || 0), 0);
  const totalGrand = items.reduce((s, i) => s + (parseFloat(i.grandTotal) || 0), 0);
  const totalScheduled = installments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const totalPaid = installments.filter((i) => i.isPaid).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const outstanding = totalGrand - totalPaid;
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ─── File handlers ─────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setUploadedFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const removeFile = (idx: number) => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleChooseSupplier = (supplier: GetSupplierData) => {
    setSelectedSupplier(supplier);
    setSupplierModalOpen(false);
  };

  const handleChoosePO = (entry: PurchaseOrderEntry) => {
    setPoLookupOpen(false);
    setForm((prev) => ({ ...prev, po_number: `[${entry.purchase_type.toUpperCase()}] ${entry.po_number}` }));
  };

  // ─── Validation ────────────────────────────────────────────────────────────

  const validateForm = () => {
    if (!form.invoice_number) throw new Error('Invoice number is required');
    if (!form.invoice_date) throw new Error('Invoice date is required');
    if (!selectedSupplier?.supplier_id) throw new Error('Supplier is required');
    if (!currencySelected) throw new Error('Currency is required');
    if (!form.exchange_rate || Number(form.exchange_rate) <= 0) throw new Error('Exchange rate is required');
    if (!termSelected) throw new Error('Payment term / Incoterm is required');
    if (items.length === 0) throw new Error('At least one item is required');
    if (items.some((i) => !i.itemId)) throw new Error('All items must have a product selected');
    if (items.some((i) => Number(i.qty) <= 0)) throw new Error('All items must have a valid quantity');
    if (items.some((i) => Number(i.unitPrice) <= 0)) throw new Error('All items must have a valid unit price');
    if (useInstallments && installments.length > 0) {
      if (Math.abs(totalScheduled - totalGrand) > 0.01) {
        throw new Error(`Payment schedule total (${fmt(totalScheduled)}) must match invoice grand total (${fmt(totalGrand)})`);
      }
    }
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleSaveDraft = async () => {
    try {
      validateForm();
      setLoading(true);
      // TODO: call createInvoice API
      showSuccess('Invoice saved as draft.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePostInvoice = async () => {
    try {
      validateForm();
      setLoading(true);
      // TODO: call createInvoice API then submit action
      showSuccess('Invoice posted successfully.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      validateForm();
      setLoading(true);
      // TODO: call updateInvoice API
      setInvStatus('draft');
      showSuccess('Invoice updated successfully.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAction = async () => {
    try {
      setLoading(true);
      // TODO: call submit action API
      setInvStatus('submitted');
      showSuccess('Invoice submitted for approval.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      // TODO: call approve action API
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
      // TODO: call reject action API
      setInvStatus('cancelled');
      setIsRejectDialogOpen(false);
      showSuccess('Invoice rejected.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setRejectLoading(false);
    }
  };

  // ─── Status badge ──────────────────────────────────────────────────────────

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; colorPalette: string }> = {
      draft:     { label: 'Draft',     colorPalette: 'yellow' },
      submitted: { label: 'Submitted', colorPalette: 'blue'   },
      posted:    { label: 'Posted',    colorPalette: 'green'  },
      cancelled: { label: 'Cancelled', colorPalette: 'red'    },
    };
    const s = map[status] ?? { label: status, colorPalette: 'gray' };
    return <Badge colorPalette={s.colorPalette} variant="subtle" ml={3}>{s.label}</Badge>;
  };

  // ─── Action buttons ────────────────────────────────────────────────────────

  const ActionButtons = () => {
    if (mode === 'create') {
      return (
        <Flex gap={3}>
          <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={handleSaveDraft} loading={loading}>
            Save as Draft
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={handlePostInvoice} loading={loading}>
            Post Invoice
          </Button>
        </Flex>
      );
    }
    if (invStatus === 'draft' || invStatus === 'cancelled') {
      return (
        <Flex gap={3}>
          <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={handleUpdate} loading={loading}>
            Save
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={handleSubmitAction} loading={loading}>
            Submit
          </Button>
        </Flex>
      );
    }
    if (invStatus === 'submitted' && canApprove) {
      return (
        <Flex gap={3}>
          <Button variant="outline" colorPalette="red" onClick={() => setIsRejectDialogOpen(true)}>
            Reject
          </Button>
          <Button bg="green.500" color="white" onClick={handleApprove} loading={loading}>
            Approve
          </Button>
        </Flex>
      );
    }
    return null;
  };

  if (loading) return <Loading />;

  return (
    <SidebarWithHeader username={auth?.username ?? 'Unknown'} daysToExpire={auth?.days_remaining ?? 0}>

      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Flex flexDir="column">
          <Flex align="center">
            <Heading size="lg">
              {mode === 'create' ? 'Create Purchase Invoice' : 'Purchase Invoice'}
            </Heading>
            {mode === 'view' && statusBadge(invStatus)}
          </Flex>
          <Text color="gray.500" fontSize="sm">
            Supplier invoice management for B2B import/export with installment payment support
          </Text>
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

        {/* ── Invoice Details ──────────────────────────────────────────────── */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">Invoice Details</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>

              <Field.Root required>
                <Field.Label fontSize="sm">Invoice No.<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  placeholder="INV/2026/04/0001"
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label fontSize="sm">Invoice Date<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="date"
                  value={form.invoice_date}
                  onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Due Date</Field.Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label fontSize="sm">Supplier / Vendor<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={selectedSupplier?.supplier_name ?? ''}
                  readOnly
                  cursor={isReadOnly ? 'default' : 'pointer'}
                  placeholder="Click to select supplier"
                  onClick={() => !isReadOnly && setSupplierModalOpen(true)}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Supplier Info</Field.Label>
                <Box fontSize="xs" color="gray.500" lineHeight="short" pt={1}>
                  <Text>{selectedSupplier?.origin_name ?? '—'}</Text>
                  <Text>{selectedSupplier?.currency_name ? `Currency: ${selectedSupplier.currency_name}` : '—'}</Text>
                  <Text>{selectedSupplier?.term_name ? `Term: ${selectedSupplier.term_name}` : '—'}</Text>
                </Box>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">PO Reference</Field.Label>
                <Input
                  value={form.po_number}
                  readOnly
                  cursor={isReadOnly ? 'default' : 'pointer'}
                  placeholder="Click to link a Purchase Order"
                  onClick={() => !isReadOnly && setPoLookupOpen(true)}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label fontSize="sm">Currency<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  collection={currencyCollection}
                  value={currencySelected ? [currencySelected] : []}
                  onValueChange={(d) => setCurrencySelected(d.value[0])}
                  disabled={isReadOnly}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select currency" />
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

              <Field.Root required>
                <Field.Label fontSize="sm">Exchange Rate (to IDR)<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="number"
                  value={form.exchange_rate}
                  onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })}
                  placeholder="e.g. 15750"
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label fontSize="sm">Payment Term / Incoterm<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  collection={termCollection}
                  value={termSelected ? [termSelected] : []}
                  onValueChange={(d) => setTermSelected(d.value[0])}
                  disabled={isReadOnly}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select term" />
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
              <Field.Label fontSize="sm">Notes / Remarks</Field.Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes or internal remarks"
                readOnly={isReadOnly}
              />
            </Field.Root>
          </Card.Body>
        </Card.Root>

        {/* ── Shipping & Logistics (B2B export/import) ─────────────────────── */}
        <Card.Root>
          <Card.Header>
            <Flex flexDir="column">
              <Heading size="md">Shipping & Logistics</Heading>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Port details, vessel/flight info and shipment timeline
              </Text>
            </Flex>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>

              <Field.Root>
                <Field.Label fontSize="sm">Port of Loading (Origin)</Field.Label>
                <Select.Root
                  collection={portCollection}
                  value={originSelected ? [originSelected] : []}
                  onValueChange={(d) => setOriginSelected(d.value[0])}
                  disabled={isReadOnly}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select origin port" />
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

              <Field.Root>
                <Field.Label fontSize="sm">Port of Discharge (Destination)</Field.Label>
                <Select.Root
                  collection={portCollection}
                  value={destinationSelected ? [destinationSelected] : []}
                  onValueChange={(d) => setDestinationSelected(d.value[0])}
                  disabled={isReadOnly}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select destination port" />
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

              <Field.Root>
                <Field.Label fontSize="sm">Vessel / Flight No.</Field.Label>
                <Input
                  value={form.vessel_flight}
                  onChange={(e) => setForm({ ...form, vessel_flight: e.target.value })}
                  placeholder="e.g. MV ORIENT STAR / GA 840"
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">B/L or AWB Number</Field.Label>
                <Input
                  value={form.bl_awb_number}
                  onChange={(e) => setForm({ ...form, bl_awb_number: e.target.value })}
                  placeholder="Bill of Lading / Air Waybill number"
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">ETD (Est. Departure)</Field.Label>
                <Input
                  type="date"
                  value={form.etd}
                  onChange={(e) => setForm({ ...form, etd: e.target.value })}
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">ETA (Est. Arrival)</Field.Label>
                <Input
                  type="date"
                  value={form.eta}
                  onChange={(e) => setForm({ ...form, eta: e.target.value })}
                  readOnly={isReadOnly}
                />
              </Field.Root>

            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* ── Invoice Items ────────────────────────────────────────────────── */}
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Heading size="md">Invoice Items</Heading>
              {!isReadOnly && (
                <Button size="sm" bg={BIZGEN_COLOR} color="white" onClick={addItem}>
                  Add Item
                </Button>
              )}
            </Flex>
          </Card.Header>
          <Card.Body>
            <Box overflowX="auto">

              {/* Column headers */}
              <Flex minW="1500px" gap={3} mb={2} px={1}>
                {([
                  ['32px',  '#'],
                  ['220px', 'Item / Description'],
                  ['80px',  'Qty'],
                  ['110px', 'UOM'],
                  ['120px', 'Pkg Size'],
                  ['140px', `Unit Price${selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}`],
                  ['120px', 'Subtotal'],
                  ['70px',  'VAT %'],
                  ['110px', 'VAT Amt'],
                  ['130px', 'Grand Total'],
                  ['110px', 'Remarks'],
                  ['40px',  ''],
                ] as [string, string][]).map(([w, label], i) => (
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

                  {/* Item combobox */}
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
                          placeholder="Search item..."
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          onFocus={() => setItemCollection(itemMasterAll)}
                        />
                        <Combobox.IndicatorGroup><Combobox.Trigger /></Combobox.IndicatorGroup>
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
                        <Select.Trigger><Select.ValueText placeholder="UOM" /></Select.Trigger>
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

                  <Box w="120px" flexShrink={0}>
                    <Input placeholder="e.g. 25 KG BAG" value={item.packageSize}
                      onChange={(e) => handleItemChange(item.id, 'packageSize', e.target.value)} readOnly={isReadOnly} />
                  </Box>

                  <Box w="140px" flexShrink={0}>
                    <Input type="number" placeholder="0" value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)} readOnly={isReadOnly} />
                  </Box>

                  <Box w="120px" flexShrink={0}>
                    <Input value={fmt(parseFloat(item.total) || 0)} readOnly bg="gray.50" />
                  </Box>

                  <Box w="70px" flexShrink={0}>
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
                    <Input placeholder="Remarks" value={item.remarks}
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

              {/* Item totals */}
              <Separator mt={2} mb={4} />
              <Flex justify="flex-end" minW="1500px" pr={1}>
                <Box w="420px">
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" color="gray.600">
                      Subtotal{selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}
                    </Text>
                    <Text fontSize="sm" fontWeight="semibold">{fmt(totalSubtotal)}</Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" color="gray.600">Total VAT</Text>
                    <Text fontSize="sm" fontWeight="semibold">{fmt(totalVat)}</Text>
                  </Flex>
                  <Separator mb={2} />
                  <Flex justify="space-between">
                    <Text fontWeight="bold">
                      Grand Total{selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}
                    </Text>
                    <Text fontWeight="bold" color={BIZGEN_COLOR}>{fmt(totalGrand)}</Text>
                  </Flex>
                </Box>
              </Flex>

            </Box>
          </Card.Body>
        </Card.Root>

        {/* ── Payment Schedule (Cicilan) ───────────────────────────────────── */}
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Flex flexDir="column">
                <Heading size="md">Payment Schedule</Heading>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Set up installment terms (cicilan) — track partial payments against this invoice
                </Text>
              </Flex>
              {!isReadOnly && (
                <Flex align="center" gap={3}>
                  <Checkbox.Root
                    checked={useInstallments}
                    onCheckedChange={(details) => {
                      const on = !!details.checked;
                      setUseInstallments(on);
                      if (on && installments.length === 0) setInstallments([newInstallment()]);
                      if (!on) setInstallments([]);
                    }}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label fontSize="sm">Use installments</Checkbox.Label>
                  </Checkbox.Root>
                  {useInstallments && (
                    <Button size="sm" variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={addInstallment}>
                      Add Installment
                    </Button>
                  )}
                </Flex>
              )}
            </Flex>
          </Card.Header>

          <Card.Body>
            {!useInstallments && installments.length === 0 ? (
              <Flex
                align="center"
                justify="center"
                direction="column"
                gap={2}
                py={6}
                borderRadius="lg"
                border="1px dashed"
                borderColor="gray.200"
                textAlign="center"
                color="gray.400"
              >
                <Text fontSize="sm">Payment schedule is disabled.</Text>
                <Text fontSize="xs">
                  Enable &ldquo;Use installments&rdquo; above to split this invoice into multiple payment terms (cicilan).
                </Text>
              </Flex>
            ) : installments.length === 0 ? (
              <Text fontSize="sm" color="gray.400" fontStyle="italic">
                No installments yet. Click &ldquo;Add Installment&rdquo; to set up the payment schedule.
              </Text>
            ) : (
                <>
                  <Box overflowX="auto">

                    {/* Installment table headers */}
                    <Flex minW="900px" gap={3} mb={2} px={1}>
                      {([
                        ['32px',  '#'],
                        ['160px', 'Due Date'],
                        ['180px', `Amount (${selectedCurrencyCode || 'CCY'})`],
                        ['80px',  'Paid'],
                        ['160px', 'Paid Date'],
                        ['220px', 'Notes / Term Description'],
                        ['40px',  ''],
                      ] as [string, string][]).map(([w, label], i) => (
                        <Box key={i} w={w} flexShrink={0}>
                          <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{label}</Text>
                        </Box>
                      ))}
                    </Flex>

                    {installments.map((inst, idx) => (
                      <Flex key={inst.id} minW="900px" gap={3} mb={3} align="center" px={1}>
                        <Box w="32px" flexShrink={0}>
                          <Text fontSize="sm" color="gray.400">{idx + 1}</Text>
                        </Box>

                        <Box w="160px" flexShrink={0}>
                          <Input
                            type="date"
                            value={inst.dueDate}
                            onChange={(e) => updateInstallment(inst.id, 'dueDate', e.target.value)}
                            readOnly={isReadOnly}
                          />
                        </Box>

                        <Box w="180px" flexShrink={0}>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={inst.amount}
                            onChange={(e) => updateInstallment(inst.id, 'amount', e.target.value)}
                            readOnly={isReadOnly}
                          />
                        </Box>

                        <Box w="80px" flexShrink={0} display="flex" justifyContent="center">
                          <Checkbox.Root
                            checked={inst.isPaid}
                            onCheckedChange={(details) => updateInstallment(inst.id, 'isPaid', !!details.checked)}
                            disabled={isReadOnly}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>
                        </Box>

                        <Box w="160px" flexShrink={0}>
                          <Input
                            type="date"
                            value={inst.paidDate}
                            onChange={(e) => updateInstallment(inst.id, 'paidDate', e.target.value)}
                            readOnly={isReadOnly || !inst.isPaid}
                            opacity={inst.isPaid ? 1 : 0.4}
                          />
                        </Box>

                        <Box w="220px" flexShrink={0}>
                          <Input
                            placeholder="e.g. 30% down payment"
                            value={inst.notes}
                            onChange={(e) => updateInstallment(inst.id, 'notes', e.target.value)}
                            readOnly={isReadOnly}
                          />
                        </Box>

                        <Box w="40px" flexShrink={0}>
                          {!isReadOnly && (
                            <IconButton
                              aria-label="Remove installment"
                              variant="ghost"
                              color="red.500"
                              size="sm"
                              onClick={() => removeInstallment(inst.id)}
                            >
                              <FaTrash />
                            </IconButton>
                          )}
                        </Box>
                      </Flex>
                    ))}
                  </Box>

                  {/* Payment schedule summary */}
                  <Separator mt={2} mb={4} />
                  <Flex justify="flex-end">
                    <Box w="360px">
                      <Flex justify="space-between" mb={1}>
                        <Text fontSize="sm" color="gray.600">Invoice Grand Total</Text>
                        <Text fontSize="sm" fontWeight="semibold">{fmt(totalGrand)}</Text>
                      </Flex>
                      <Flex justify="space-between" mb={1}>
                        <Text fontSize="sm" color="gray.600">Total Scheduled</Text>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color={Math.abs(totalScheduled - totalGrand) > 0.01 ? 'red.500' : 'inherit'}
                        >
                          {fmt(totalScheduled)}
                          {Math.abs(totalScheduled - totalGrand) > 0.01 && (
                            <Text as="span" fontSize="xs" ml={1}>(must match grand total)</Text>
                          )}
                        </Text>
                      </Flex>
                      <Flex justify="space-between" mb={1}>
                        <Text fontSize="sm" color="green.600">Total Paid</Text>
                        <Text fontSize="sm" fontWeight="semibold" color="green.600">{fmt(totalPaid)}</Text>
                      </Flex>
                      <Separator mb={2} />
                      <Flex justify="space-between">
                        <Text fontWeight="bold" color={outstanding > 0 ? BIZGEN_COLOR : 'green.600'}>
                          Outstanding Balance
                        </Text>
                        <Text fontWeight="bold" color={outstanding > 0 ? BIZGEN_COLOR : 'green.600'}>
                          {fmt(outstanding)}
                        </Text>
                      </Flex>
                    </Box>
                  </Flex>
                </>
              )}
            </Card.Body>
        </Card.Root>

        {/* ── Supporting Documents ─────────────────────────────────────────── */}
        {!isReadOnly && (
          <Card.Root>
            <Card.Header>
              <Flex flexDir="column">
                <Heading size="md">Supporting Documents</Heading>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Attach Commercial Invoice, Packing List, B/L, Certificate of Origin, etc.
                </Text>
              </Flex>
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
                <Text fontSize="sm" color="gray.500">Drag & drop or click to upload documents</Text>
                <Button size="sm" variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} pointerEvents="none">
                  Choose Files
                </Button>
              </Flex>
              <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} />
              {uploadedFiles.length > 0 && (
                <Stack mt={4} gap={2}>
                  {uploadedFiles.map((file, idx) => (
                    <Flex key={idx} align="center" justify="space-between" px={3} py={2}
                      borderRadius="md" border="1px solid" borderColor="gray.200" bg="gray.50">
                      <Flex align="center" gap={2}>
                        <Icon as={FiFileText} color="gray.500" />
                        <Text fontSize="sm" color="gray.700">{file.name}</Text>
                        <Text fontSize="xs" color="gray.400">({(file.size / 1024).toFixed(1)} KB)</Text>
                      </Flex>
                      <IconButton aria-label="Remove file" variant="ghost" size="xs" color="red.400" onClick={() => removeFile(idx)}>
                        <FiX />
                      </IconButton>
                    </Flex>
                  ))}
                </Stack>
              )}
            </Card.Body>
          </Card.Root>
        )}

        {/* ── History ──────────────────────────────────────────────────────── */}
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
                      <Text fontSize="xs" color="gray.400">
                        {h.created_by} · {new Date(h.created_at).toLocaleString()}
                      </Text>
                    </Box>
                  </Flex>
                ))}
              </Stack>
            </Card.Body>
          </Card.Root>
        )}

      </Stack>

      {/* Bottom action buttons */}
      <Flex justify="flex-end" gap={3} mt={6}>
        <ActionButtons />
      </Flex>

    </SidebarWithHeader>
  );
}
