'use client';

import Loading from '@/components/loading';
import SupplierLookup from '@/components/lookup/SupplierLookup';
import RejectDialog from '@/components/dialog/RejectDialog';
import { AlertMessage } from '@/components/ui/alert';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { SALES_APPROVAL_ROLES, checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { getAllCurrency, GetCurrencyData } from '@/lib/master/currency';
import { getAllPort, GetPortData } from '@/lib/master/port';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { GetSupplierData } from '@/lib/master/supplier';
import {
  getPurchaseLocalBySupplier,
  getPurchaseLocalDetail,
  GetPurchaseLocalData,
} from '@/lib/purchase/local';
import {
  getPurchaseImportBySupplier,
  getPurchaseImportDetail,
  GetPurchaseImportData,
} from '@/lib/purchase/import';
import {
  Badge, Box, Button, Card, Checkbox, createListCollection,
  Field, Flex, Heading, Icon, IconButton, Input, Portal,
  Select, Separator, SimpleGrid, Stack, Spinner, Table, Text, Textarea,
} from '@chakra-ui/react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaTrash } from 'react-icons/fa';
import { FiFileText, FiUpload, FiX } from 'react-icons/fi';

const BIZGEN_COLOR = '#E77A1F';

type BillMode = 'create' | 'view';

type UnpaidPO = {
  purchase_id: string;
  po_number: string;
  po_date: string;
  purchase_type: 'local' | 'import';
};

type BillItem = {
  id: string;
  itemId: string;
  description: string;
  qty: string;
  uomName: string;
  unitPrice: string;
  total: string;
  vatPercent: string;
  vatAmount: string;
  grandTotal: string;
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

function newInstallment(): PaymentInstallment {
  return { id: crypto.randomUUID(), dueDate: '', amount: '', isPaid: false, paidDate: '', notes: '' };
}

export default function CreateVendorBillPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CreateVendorBillContent />
    </Suspense>
  );
}

function CreateVendorBillContent() {
  const searchParams = useSearchParams();
  const billId = searchParams.get('bill_id');

  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const t = getLang(lang);

  const canApprove = SALES_APPROVAL_ROLES.has(auth?.app_role_id ?? '');

  const [mode, setMode] = useState<BillMode>('create');
  const [billStatus, setBillStatus] = useState('');
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
  const [termOptions, setTermOptions] = useState<GetTermData[]>([]);
  const [portOptions, setPortOptions] = useState<GetPortData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((c) => ({ label: `${c.currency_code} — ${c.currency_name}`, value: c.currency_id })),
  });
  const termCollection = createListCollection({
    items: termOptions.map((tm) => ({ label: tm.term_name, value: tm.term_id })),
  });
  const portCollection = createListCollection({
    items: portOptions.map((p) => ({ label: `${p.port_name} — ${p.origin_name}`, value: p.port_id })),
  });

  // Supplier & PO
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<GetSupplierData | null>(null);
  const [unpaidPOList, setUnpaidPOList] = useState<UnpaidPO[]>([]);
  const [poLoading, setPOLoading] = useState(false);
  const [linkedPO, setLinkedPO] = useState<UnpaidPO | null>(null);

  // Form
  const [form, setForm] = useState({
    bill_number: '',
    bill_date: '',
    due_date: '',
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

  // Line items (auto-populated from selected PO)
  const [items, setItems] = useState<BillItem[]>([]);

  // Payment type
  const [paymentType, setPaymentType] = useState<'full' | 'installment'>('full');
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);

  // Document upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const isReadOnly = mode === 'view' && (billStatus === 'posted' || billStatus === 'submitted');
  const selectedCurrencyCode = currencyOptions.find((c) => c.currency_id === currencySelected)?.currency_code ?? '';
  const isIDR = selectedCurrencyCode === 'IDR';

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if (!valid) return;

        const info = getAuthInfo();
        setAuth(info);
        setLang(info?.language === 'id' ? 'id' : 'en');

        const [currencyRes, termRes, portRes] = await Promise.all([
          getAllCurrency(1, 1000),
          getAllTerm(1, 1000),
          getAllPort(1, 1000),
        ]);

        setCurrencyOptions(currencyRes?.data ?? []);
        setTermOptions(termRes?.data ?? []);
        setPortOptions(portRes?.data ?? []);

        if (!billId) {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const todayStr = today.toISOString().split('T')[0];
          setForm((prev) => ({
            ...prev,
            bill_number: `BILL/${year}/${month}/`,
            bill_date: todayStr,
          }));
        } else {
          setMode('view');
          // TODO: load vendor bill detail from API
        }
      } catch (err) {
        console.error('Failed to initialize:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [billId]);

  // ─── Supplier & PO handlers ───────────────────────────────────────────────

  const handleChooseSupplier = (supplier: GetSupplierData) => {
    setSelectedSupplier(supplier);
    setSupplierModalOpen(false);
    setLinkedPO(null);
    setItems([]);
    setUnpaidPOList([]);
    fetchUnpaidPOs(supplier.supplier_id);
  };

  const fetchUnpaidPOs = async (supplierId: string) => {
    setPOLoading(true);
    try {
      const [localRes, importRes] = await Promise.all([
        getPurchaseLocalBySupplier(supplierId),
        getPurchaseImportBySupplier(supplierId),
      ]);

      const localPOs: UnpaidPO[] = (localRes.data ?? []).map((d: GetPurchaseLocalData) => ({
        purchase_id: d.purchase_id,
        po_number: d.po_number,
        po_date: d.po_date,
        purchase_type: 'local' as const,
      }));

      const importPOs: UnpaidPO[] = (importRes.data ?? []).map((d: GetPurchaseImportData) => ({
        purchase_id: d.purchase_id,
        po_number: d.po_number,
        po_date: d.po_date,
        purchase_type: 'import' as const,
      }));

      setUnpaidPOList([...localPOs, ...importPOs]);
    } catch {
      setUnpaidPOList([]);
    } finally {
      setPOLoading(false);
    }
  };

  const handleSelectPO = async (po: UnpaidPO) => {
    setLinkedPO(po);
    try {
      setLoading(true);
      let mappedItems: BillItem[] = [];

      if (po.purchase_type === 'local') {
        const detail = await getPurchaseLocalDetail(po.purchase_id);
        mappedItems = detail.items.map((item) => ({
          id: crypto.randomUUID(),
          itemId: item.item_id,
          description: item.item_name,
          qty: item.qty,
          uomName: item.uom_name,
          unitPrice: item.unit_price,
          total: item.line_total,
          vatPercent: '0',
          vatAmount: '0',
          grandTotal: item.line_total,
        }));
      } else {
        const detail = await getPurchaseImportDetail(po.purchase_id);
        mappedItems = detail.items.map((item) => ({
          id: crypto.randomUUID(),
          itemId: item.item_id,
          description: item.description || item.item_name,
          qty: item.qty,
          uomName: item.uom_name,
          unitPrice: item.unit_price,
          total: item.line_total,
          vatPercent: '0',
          vatAmount: '0',
          grandTotal: item.line_total,
        }));
      }

      setItems(mappedItems);
    } catch (err) {
      console.error(err);
      showError('Failed to load purchase order details.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearPO = () => {
    setLinkedPO(null);
    setItems([]);
  };

  // ─── Installment handlers ──────────────────────────────────────────────────

  const addInstallment = () => setInstallments((prev) => [...prev, newInstallment()]);
  const removeInstallment = (id: string) => setInstallments((prev) => prev.filter((i) => i.id !== id));
  const updateInstallment = (id: string, field: keyof PaymentInstallment, value: any) => {
    setInstallments((prev) => prev.map((i) => i.id !== id ? i : { ...i, [field]: value }));
  };

  const handlePaymentTypeChange = (type: 'full' | 'installment') => {
    setPaymentType(type);
    if (type === 'installment' && installments.length === 0) {
      setInstallments([newInstallment()]);
    }
    if (type === 'full') {
      setInstallments([]);
    }
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

  // ─── Validation ────────────────────────────────────────────────────────────

  const validateForm = () => {
    if (!form.bill_number) throw new Error('Bill number is required');
    if (!form.bill_date) throw new Error('Bill date is required');
    if (!selectedSupplier?.supplier_id) throw new Error('Supplier is required');
    if (!linkedPO?.purchase_id) throw new Error('Purchase order is required');
    if (!currencySelected) throw new Error('Currency is required');
    if (!isIDR && (!form.exchange_rate || Number(form.exchange_rate) <= 0)) throw new Error('Exchange rate is required for non-IDR currency');
    if (!termSelected) throw new Error('Payment term / Incoterm is required');
    if (items.length === 0) throw new Error('Purchase order must have at least one item');
    if (paymentType === 'installment' && installments.length > 0) {
      if (Math.abs(totalScheduled - totalGrand) > 0.01) {
        throw new Error(`Payment schedule total (${fmt(totalScheduled)}) must match bill grand total (${fmt(totalGrand)})`);
      }
    }
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleSaveDraft = async () => {
    try {
      validateForm();
      setLoading(true);
      showSuccess('Vendor bill saved as draft.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePostBill = async () => {
    try {
      validateForm();
      setLoading(true);
      showSuccess('Vendor bill posted successfully.');
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
      setBillStatus('draft');
      showSuccess('Vendor bill updated successfully.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAction = async () => {
    try {
      setLoading(true);
      setBillStatus('submitted');
      showSuccess('Vendor bill submitted for approval.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      setBillStatus('posted');
      showSuccess('Vendor bill approved and posted.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      setRejectLoading(true);
      setBillStatus('cancelled');
      setIsRejectDialogOpen(false);
      showSuccess('Vendor bill rejected.');
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
          <Button bg={BIZGEN_COLOR} color="white" onClick={handlePostBill} loading={loading}>
            Post Vendor Bill
          </Button>
        </Flex>
      );
    }
    if (billStatus === 'draft' || billStatus === 'cancelled') {
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
    if (billStatus === 'submitted' && canApprove) {
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
              {mode === 'create' ? 'Create Vendor Bill' : 'Vendor Bill'}
            </Heading>
            {mode === 'view' && statusBadge(billStatus)}
          </Flex>
          <Text color="gray.500" fontSize="sm">
            Select a supplier to view their unpaid purchase orders, then choose a payment method
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

      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleReject}
        loading={rejectLoading}
      />

      <Stack gap={6}>

        {/* ── Bill Details ─────────────────────────────────────────────────── */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">Bill Details</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>

              <Field.Root required>
                <Field.Label fontSize="sm">Bill No.<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={form.bill_number}
                  onChange={(e) => setForm({ ...form, bill_number: e.target.value })}
                  placeholder="BILL/2026/04/0001"
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label fontSize="sm">Bill Date<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="date"
                  value={form.bill_date}
                  onChange={(e) => setForm({ ...form, bill_date: e.target.value })}
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
                  _hover={!isReadOnly ? { borderColor: BIZGEN_COLOR } : {}}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Supplier Info</Field.Label>
                <Box fontSize="xs" color="gray.500" lineHeight="short" pt={1}>
                  {selectedSupplier ? (
                    <>
                      <Text>{selectedSupplier.origin_name || '—'}</Text>
                      <Text>{selectedSupplier.currency_name ? `Currency: ${selectedSupplier.currency_name}` : '—'}</Text>
                      <Text>{selectedSupplier.term_name ? `Term: ${selectedSupplier.term_name}` : '—'}</Text>
                    </>
                  ) : (
                    <Text color="gray.400" fontStyle="italic">No supplier selected</Text>
                  )}
                </Box>
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

              {!isIDR && (
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
              )}

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

        {/* ── Unpaid Purchase Orders ───────────────────────────────────────── */}
        <Card.Root>
          <Card.Header>
            <Flex flexDir="column">
              <Heading size="md">Purchase Orders</Heading>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {selectedSupplier
                  ? `Unpaid purchase orders for ${selectedSupplier.supplier_name} (local & import)`
                  : 'Select a supplier above to see their unpaid purchase orders'}
              </Text>
            </Flex>
          </Card.Header>
          <Card.Body>
            {!selectedSupplier ? (
              <Flex
                align="center" justify="center" direction="column" gap={2} py={8}
                borderRadius="lg" border="1px dashed" borderColor="gray.200"
                textAlign="center" color="gray.400"
              >
                <Text fontSize="sm">No supplier selected</Text>
                <Text fontSize="xs">Select a supplier first to load their unpaid purchase orders.</Text>
              </Flex>
            ) : poLoading ? (
              <Flex align="center" justify="center" py={8} gap={3}>
                <Spinner size="sm" color={BIZGEN_COLOR} />
                <Text fontSize="sm" color="gray.500">Loading unpaid purchase orders…</Text>
              </Flex>
            ) : unpaidPOList.length === 0 ? (
              <Flex
                align="center" justify="center" direction="column" gap={2} py={8}
                borderRadius="lg" border="1px dashed" borderColor="gray.200"
                textAlign="center" color="gray.400"
              >
                <Text fontSize="sm">No unpaid purchase orders found</Text>
                <Text fontSize="xs">All purchase orders for this supplier have been billed.</Text>
              </Flex>
            ) : (
              <Box>
                {linkedPO && (
                  <Flex align="center" gap={2} mb={4} px={3} py={2}
                    borderRadius="md" bg="orange.50" border="1px solid" borderColor="orange.200"
                  >
                    <Text fontSize="sm" fontWeight="semibold" color={BIZGEN_COLOR}>
                      Selected: {linkedPO.po_number}
                    </Text>
                    <Badge colorPalette={linkedPO.purchase_type === 'local' ? 'blue' : 'orange'} variant="subtle" ml={1}>
                      {linkedPO.purchase_type === 'local' ? 'Local' : 'Import'}
                    </Badge>
                    {!isReadOnly && (
                      <IconButton
                        aria-label="Clear PO selection"
                        variant="ghost"
                        size="xs"
                        color="gray.500"
                        onClick={handleClearPO}
                        ml="auto"
                      >
                        <FiX />
                      </IconButton>
                    )}
                  </Flex>
                )}
                <Table.Root>
                  <Table.Header>
                    <Table.Row bg="bg.panel">
                      <Table.ColumnHeader>PO Number</Table.ColumnHeader>
                      <Table.ColumnHeader>PO Date</Table.ColumnHeader>
                      <Table.ColumnHeader>Type</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Action</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {unpaidPOList.map((po) => {
                      const isSelected = linkedPO?.purchase_id === po.purchase_id && linkedPO?.purchase_type === po.purchase_type;
                      return (
                        <Table.Row
                          key={`${po.purchase_type}-${po.purchase_id}`}
                          bg={isSelected ? 'orange.50' : undefined}
                          _hover={{ bg: isSelected ? 'orange.50' : 'gray.50' }}
                        >
                          <Table.Cell fontWeight={isSelected ? 'semibold' : 'normal'}>
                            {po.po_number}
                          </Table.Cell>
                          <Table.Cell color="gray.500" fontSize="sm">
                            {po.po_date ? new Date(po.po_date).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            }) : '—'}
                          </Table.Cell>
                          <Table.Cell>
                            <Badge colorPalette={po.purchase_type === 'local' ? 'blue' : 'orange'} variant="subtle">
                              {po.purchase_type === 'local' ? 'Local' : 'Import'}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            {isSelected ? (
                              <Badge colorPalette="orange" variant="subtle">Selected</Badge>
                            ) : (
                              !isReadOnly && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  color={BIZGEN_COLOR}
                                  borderColor={BIZGEN_COLOR}
                                  onClick={() => handleSelectPO(po)}
                                >
                                  Select
                                </Button>
                              )
                            )}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Card.Body>
        </Card.Root>

        {/* ── Bill Items (from selected PO) ────────────────────────────────── */}
        <Card.Root>
          <Card.Header>
            <Flex flexDir="column">
              <Heading size="md">Bill Items</Heading>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Items are loaded from the selected purchase order
              </Text>
            </Flex>
          </Card.Header>
          <Card.Body>
            {items.length === 0 ? (
              <Flex
                align="center" justify="center" direction="column" gap={2} py={8}
                borderRadius="lg" border="1px dashed" borderColor="gray.200"
                textAlign="center" color="gray.400"
              >
                <Text fontSize="sm">No items loaded</Text>
                <Text fontSize="xs">Select a purchase order above to load its items.</Text>
              </Flex>
            ) : (
              <Box overflowX="auto">
                <Flex minW="1000px" gap={3} mb={2} px={1}>
                  {([
                    ['32px',  '#'],
                    ['240px', 'Item / Description'],
                    ['80px',  'Qty'],
                    ['100px', 'UOM'],
                    ['150px', `Unit Price${selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}`],
                    ['150px', 'Line Total'],
                  ] as [string, string][]).map(([w, label], i) => (
                    <Box key={i} w={w} flexShrink={0}>
                      <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{label}</Text>
                    </Box>
                  ))}
                </Flex>

                {items.map((item, idx) => (
                  <Flex key={item.id} minW="1000px" gap={3} mb={3} align="center" px={1}>
                    <Box w="32px" flexShrink={0}>
                      <Text fontSize="sm" color="gray.400">{idx + 1}</Text>
                    </Box>
                    <Box w="240px" flexShrink={0}>
                      <Input value={item.description} readOnly bg="gray.50" fontSize="sm" />
                    </Box>
                    <Box w="80px" flexShrink={0}>
                      <Input value={item.qty} readOnly bg="gray.50" />
                    </Box>
                    <Box w="100px" flexShrink={0}>
                      <Input value={item.uomName} readOnly bg="gray.50" />
                    </Box>
                    <Box w="150px" flexShrink={0}>
                      <Input value={fmt(parseFloat(item.unitPrice) || 0)} readOnly bg="gray.50" />
                    </Box>
                    <Box w="150px" flexShrink={0}>
                      <Input value={fmt(parseFloat(item.grandTotal) || 0)} readOnly bg="gray.50" fontWeight="semibold" />
                    </Box>
                  </Flex>
                ))}

                <Separator mt={2} mb={4} />
                <Flex justify="flex-end" minW="1000px" pr={1}>
                  <Box w="340px">
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="sm" color="gray.600">
                        Subtotal{selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}
                      </Text>
                      <Text fontSize="sm" fontWeight="semibold">{fmt(totalSubtotal)}</Text>
                    </Flex>
                    <Separator mb={2} />
                    <Flex justify="space-between">
                      <Text fontWeight="bold">
                        Grand Total{selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}
                      </Text>
                      <Text fontWeight="bold" color={BIZGEN_COLOR}>{fmt(totalGrand)}</Text>
                    </Flex>
                    {!isIDR && form.exchange_rate && (
                      <Flex justify="space-between" mt={1}>
                        <Text fontSize="xs" color="gray.500">Grand Total (IDR)</Text>
                        <Text fontSize="xs" color="gray.500">
                          {fmt(totalGrand * (parseFloat(form.exchange_rate) || 1))}
                        </Text>
                      </Flex>
                    )}
                  </Box>
                </Flex>
              </Box>
            )}
          </Card.Body>
        </Card.Root>

        {/* ── Payment Type ─────────────────────────────────────────────────── */}
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Flex flexDir="column">
                <Heading size="md">Payment Method</Heading>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Choose whether this bill is paid in full or in installments (cicilan)
                </Text>
              </Flex>
              {!isReadOnly && (
                <Flex gap={2}>
                  <Button
                    size="sm"
                    bg={paymentType === 'full' ? BIZGEN_COLOR : undefined}
                    color={paymentType === 'full' ? 'white' : BIZGEN_COLOR}
                    variant={paymentType === 'full' ? 'solid' : 'outline'}
                    borderColor={BIZGEN_COLOR}
                    onClick={() => handlePaymentTypeChange('full')}
                  >
                    Full Payment
                  </Button>
                  <Button
                    size="sm"
                    bg={paymentType === 'installment' ? BIZGEN_COLOR : undefined}
                    color={paymentType === 'installment' ? 'white' : BIZGEN_COLOR}
                    variant={paymentType === 'installment' ? 'solid' : 'outline'}
                    borderColor={BIZGEN_COLOR}
                    onClick={() => handlePaymentTypeChange('installment')}
                  >
                    Installment
                  </Button>
                </Flex>
              )}
            </Flex>
          </Card.Header>

          <Card.Body>
            {paymentType === 'full' ? (
              <Flex
                align="center" justify="space-between" px={6} py={4}
                borderRadius="lg" bg="orange.50" border="1px solid" borderColor="orange.200"
              >
                <Box>
                  <Text fontWeight="semibold" color={BIZGEN_COLOR}>Full Payment</Text>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Bill is paid to the supplier in a single payment.
                  </Text>
                  {form.due_date && (
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      Due date: <strong>{new Date(form.due_date).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                    </Text>
                  )}
                </Box>
                <Box textAlign="right">
                  <Text fontSize="xs" color="gray.500">Total Amount</Text>
                  <Text fontSize="xl" fontWeight="bold" color={BIZGEN_COLOR}>
                    {selectedCurrencyCode && `${selectedCurrencyCode} `}{fmt(totalGrand)}
                  </Text>
                </Box>
              </Flex>
            ) : (
              <>
                <Flex justify="flex-end" mb={4}>
                  {!isReadOnly && (
                    <Button size="sm" variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={addInstallment}>
                      Add Installment
                    </Button>
                  )}
                </Flex>

                {installments.length === 0 ? (
                  <Text fontSize="sm" color="gray.400" fontStyle="italic">
                    No installments yet. Click "Add Installment" to set up the payment schedule.
                  </Text>
                ) : (
                  <>
                    <Box overflowX="auto">
                      <Flex minW="1020px" gap={3} mb={2} px={1}>
                        {([
                          ['32px',  '#'],
                          ['100px', 'Status'],
                          ['160px', 'Due Date'],
                          ['180px', `Amount (${selectedCurrencyCode || 'CCY'})`],
                          ['80px',  'Mark Paid'],
                          ['160px', 'Paid Date'],
                          ['200px', 'Notes / Term Description'],
                          ['40px',  ''],
                        ] as [string, string][]).map(([w, label], i) => (
                          <Box key={i} w={w} flexShrink={0}>
                            <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{label}</Text>
                          </Box>
                        ))}
                      </Flex>

                      {installments.map((inst, idx) => (
                        <Flex
                          key={inst.id}
                          minW="1020px"
                          gap={3} mb={2} align="center" px={2} py={2}
                          borderRadius="md"
                          bg={inst.isPaid ? 'green.50' : 'gray.50'}
                          border="1px solid"
                          borderColor={inst.isPaid ? 'green.200' : 'gray.200'}
                        >
                          <Box w="32px" flexShrink={0}>
                            <Text fontSize="sm" color="gray.400">{idx + 1}</Text>
                          </Box>
                          <Box w="100px" flexShrink={0}>
                            <Badge colorPalette={inst.isPaid ? 'green' : 'gray'} variant="subtle">
                              {inst.isPaid ? 'Paid' : 'Scheduled'}
                            </Badge>
                          </Box>
                          <Box w="160px" flexShrink={0}>
                            <Input
                              type="date"
                              value={inst.dueDate}
                              onChange={(e) => updateInstallment(inst.id, 'dueDate', e.target.value)}
                              readOnly={isReadOnly}
                              bg="white"
                            />
                          </Box>
                          <Box w="180px" flexShrink={0}>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={inst.amount}
                              onChange={(e) => updateInstallment(inst.id, 'amount', e.target.value)}
                              readOnly={isReadOnly}
                              bg="white"
                            />
                          </Box>
                          <Box w="80px" flexShrink={0} display="flex" justifyContent="center">
                            <Checkbox.Root
                              checked={inst.isPaid}
                              onCheckedChange={(details) => updateInstallment(inst.id, 'isPaid', !!details.checked)}
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
                              readOnly={!inst.isPaid}
                              opacity={inst.isPaid ? 1 : 0.4}
                              bg="white"
                            />
                          </Box>
                          <Box w="200px" flexShrink={0}>
                            <Input
                              placeholder="e.g. 30% down payment"
                              value={inst.notes}
                              onChange={(e) => updateInstallment(inst.id, 'notes', e.target.value)}
                              readOnly={isReadOnly}
                              bg="white"
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

                    <Separator mt={2} mb={4} />
                    <Flex justify="flex-end">
                      <Box w="360px">
                        <Flex justify="space-between" mb={1}>
                          <Text fontSize="sm" color="gray.600">Bill Grand Total</Text>
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
              </>
            )}
          </Card.Body>
        </Card.Root>

        {/* ── Shipping & Logistics ─────────────────────────────────────────── */}
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
                border="1px dashed" borderColor="gray.300" borderRadius="lg"
                p={6} align="center" justify="center" direction="column"
                gap={2} textAlign="center" cursor="pointer"
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
