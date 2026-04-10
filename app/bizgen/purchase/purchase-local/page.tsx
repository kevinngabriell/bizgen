'use client';

import Loading from '@/components/loading';
import SupplierLookup from '@/components/lookup/SupplierLookup';
import RejectDialog from '@/components/dialog/RejectDialog';
import { AlertMessage } from '@/components/ui/alert';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { SALES_APPROVAL_ROLES, checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { getCompanyProfile, GetCompanyProfile } from '@/lib/account/company';
import { getAllCurrency, GetCurrencyData } from '@/lib/master/currency';
import { getAllItem, GetItemData } from '@/lib/master/item';
import { getAllPaymentMethod, GetPaymentMethodData } from '@/lib/master/payment-method';
import { getAllTax, GetTaxData } from '@/lib/master/tax';
import { getAllUOM, UOMData } from '@/lib/master/uom';
import { GetSupplierData } from '@/lib/master/supplier';
import {
  createPurchaseLocal,
  generatePurchaseLocalNumber,
  getPurchaseLocalDetail,
  updatePurchaseLocal,
  processPurchaseLocalAction,
  GetPurchaseLocalHistoryDetailData,
} from '@/lib/purchase/local';
import {
  Badge, Box, Button, Card, Combobox, createListCollection,
  Field, Flex, Heading, Icon, IconButton, Input, Portal,
  Select, Separator, SimpleGrid, Stack, Text, Textarea,
  useFilter, useListCollection,
} from '@chakra-ui/react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaTrash } from 'react-icons/fa';
import { FiFileText, FiUpload, FiX } from 'react-icons/fi';

const BIZGEN_COLOR = '#E77A1F';

type LocalMode = 'create' | 'view';

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
    const rate = parseFloat(tax.tax_rate || '0');
    if (rate === 12) {
      dpp = base * 11 / 12;
      ppn = dpp * (12 / 100);
    } else {
      // 10%, 11%, and any other rate
      dpp = base;
      ppn = base * (rate / 100);
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
  const searchParams = useSearchParams();
  const purchaseId = searchParams.get('purchase_id');

  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const t = getLang(lang);
  const tr = t.purchase_local;

  const canApprove = SALES_APPROVAL_ROLES.has(auth?.app_role_id ?? '');

  const [mode, setMode] = useState<LocalMode>('create');
  const [localId, setLocalId] = useState('');
  const [localStatus, setLocalStatus] = useState('');
  const [historyData, setHistoryData] = useState<GetPurchaseLocalHistoryDetailData[]>([]);

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

  const [companyProfile, setCompanyProfile] = useState<GetCompanyProfile | null>(null);

  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);
  const [uomOptions, setUomOptions] = useState<UOMData[]>([]);
  const [taxOptions, setTaxOptions] = useState<GetTaxData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((c) => ({ label: `${c.currency_code} — ${c.currency_name}`, value: c.currency_id })),
  });
  const uomCollection = createListCollection({
    items: uomOptions.map((u) => ({ label: u.uom_name, value: u.uom_id })),
  });
  const taxCollection = createListCollection({
    items: taxOptions.map((tx) => ({ label: `${tx.tax_name} (${tx.tax_rate}%)`, value: tx.tax_id })),
  });

  const [itemMasterAll, setItemMasterAll] = useState<GetItemData[]>([]);
  const { contains } = useFilter({ sensitivity: 'base' });
  const { collection: itemCollection, set: setItemCollection } = useListCollection<GetItemData>({
    initialItems: [],
    itemToString: (i) => `${i.item_code} — ${i.item_name}`,
    itemToValue: (i) => i.item_id,
  });

  const [paymentMasterAll, setPaymentMasterAll] = useState<GetPaymentMethodData[]>([]);
  const { collection: paymentCollection, set: setPaymentCollection } = useListCollection<GetPaymentMethodData>({
    initialItems: [],
    itemToString: (p) => p.payment_name,
    itemToValue: (p) => p.payment_id,
  });
  const [paymentSelected, setPaymentSelected] = useState('');
  const [paymentSelectedId, setPaymentSelectedId] = useState('');

  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<GetSupplierData | null>(null);

  const [form, setForm] = useState({
    po_number: '',
    po_date: '',
    shipment_date: '',
    delivery_address: '',
    notes: '',
    exchange_rate_idr: '',
  });

  const [currencySelected, setCurrencySelected] = useState<string>();
  const [taxSelected, setTaxSelected] = useState<string>();

  const selectedTax = taxOptions.find((tx) => tx.tax_id === taxSelected);
  const selectedCurrencyCode = currencyOptions.find((c) => c.currency_id === currencySelected)?.currency_code ?? '';

  const [items, setItems] = useState<PurchaseItem[]>([newItem()]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const isReadOnly = mode === 'view' && (localStatus === 'submitted' || localStatus === 'approved');

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if (!valid) return;

        const info = getAuthInfo();
        setAuth(info);
        setLang(info?.language === 'id' ? 'id' : 'en');

        const [currencyRes, uomRes, taxRes, paymentRes, itemRes] = await Promise.all([
          getAllCurrency(1, 1000),
          getAllUOM(1, 1000),
          getAllTax(1, 1000),
          getAllPaymentMethod(1, 1000),
          getAllItem(1, 1000),
        ]);

        const currencyData = currencyRes?.data ?? [];
        const uomData = uomRes?.data ?? [];
        const taxData = taxRes?.data ?? [];
        const paymentData = paymentRes?.data ?? [];
        const itemData = itemRes?.data ?? [];

        setCurrencyOptions(currencyData);
        setUomOptions(uomData);
        setTaxOptions(taxData);
        setPaymentMasterAll(paymentData);
        setPaymentCollection(paymentData);
        setItemMasterAll(itemData);
        setItemCollection(itemData);

        try {
          const profile = await getCompanyProfile();
          setCompanyProfile(profile);
        } catch { /* silently ignore */ }

        if (purchaseId) {
          setMode('view');
          const detail = await getPurchaseLocalDetail(purchaseId);
          const h = detail.header;

          setLocalId(h.purchase_id);
          setLocalStatus(h.status);
          setHistoryData(detail.history);

          setForm((prev) => ({
            ...prev,
            po_number: h.po_number,
            po_date: h.po_date,
            shipment_date: h.delivery_date,
            exchange_rate_idr: h.exchange_rate_idr ?? '',
            notes: h.notes ?? '',
            delivery_address: h.delivery_address ?? '',
          }));

          const currency = currencyData.find((c) => c.currency_code === h.currency_code);
          if (currency) setCurrencySelected(currency.currency_id);

          const tax = taxData.find((tx) => tx.tax_name === h.tax_name);
          if (tax) setTaxSelected(tax.tax_id);

          if (h.payment_id && h.payment_name) {
            setPaymentSelectedId(h.payment_id);
            setPaymentSelected(h.payment_name);
          } else {
            const payment = paymentData.find(
              (p) => p.payment_name === (h.payment_name ?? h.payment_method_name)
            );
            if (payment) {
              setPaymentSelectedId(payment.payment_id);
              setPaymentSelected(payment.payment_name);
            }
          }

          setSelectedSupplier({ supplier_name: h.supplier_name } as GetSupplierData);

          setItems(
            detail.items.map((item) => {
              const uom = uomData.find((u) => u.uom_name === item.uom_name);
              const qty = item.qty ?? '0';
              const price = item.unit_price ?? '0';
              const base: PurchaseItem = {
                id: crypto.randomUUID(),
                itemId: item.item_id,
                description: item.item_name,
                qty,
                uomId: uom?.uom_id ?? '',
                packageSize: '',
                unitPrice: price,
                total: '0',
                dpp: '0',
                ppn: '0',
                grandTotal: '0',
                remarks: item.remarks ?? '',
              };
              return calcItem(base, tax);
            })
          );
        } else {
          const numberRes = await generatePurchaseLocalNumber();
          setForm((prev) => ({ ...prev, po_number: numberRes.number }));
        }
      } catch (err) {
        console.error('Failed to initialize:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [purchaseId]);

  const handleItemChange = (id: string, field: keyof PurchaseItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return calcItem({ ...item, [field]: value }, selectedTax);
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

  const totalSubtotal = items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
  const totalPpn = items.reduce((s, i) => s + (parseFloat(i.ppn) || 0), 0);
  const totalGrand = items.reduce((s, i) => s + (parseFloat(i.grandTotal) || 0), 0);
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setUploadedFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const removeFile = (index: number) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

  const handleChooseSupplier = (supplier: GetSupplierData) => {
    setSelectedSupplier(supplier);
    setSupplierModalOpen(false);
  };

  const validateForm = () => {
    if (!form.po_number) throw new Error(tr.error_po_number);
    if (!form.po_date) throw new Error(tr.error_po_date);
    if (!selectedSupplier?.supplier_id) throw new Error(tr.error_supplier);
    if (!form.shipment_date) throw new Error(tr.error_delivery_date);
    if (!paymentSelectedId) throw new Error(tr.error_payment);
    if (items.length === 0) throw new Error(tr.error_items);
    if (items.some((i) => !i.itemId)) throw new Error(tr.error_item_id);
    if (items.some((i) => Number(i.qty) <= 0)) throw new Error(tr.error_item_qty);
    if (items.some((i) => Number(i.unitPrice) <= 0)) throw new Error(tr.error_item_price);
  };

  const buildPayloadItems = () =>
    items.map(({ id: _id, ...rest }) => ({
      item_id: rest.itemId,
      qty: Number(rest.qty),
      unit_price: Number(rest.unitPrice),
      uom_id: rest.uomId,
      remarks: rest.remarks,
    }));

  const resetForm = async () => {
    const res = await generatePurchaseLocalNumber();
    setForm({ po_number: res.number, po_date: '', shipment_date: '', delivery_address: '', exchange_rate_idr: '', notes: '' });
    setSelectedSupplier(null);
    setCurrencySelected(undefined);
    setTaxSelected(undefined);
    setPaymentSelected('');
    setPaymentSelectedId('');
    setItems([newItem()]);
    setUploadedFiles([]);
  };

  const handleSaveDraft = async () => {
    try {
      validateForm();
      setLoading(true);
      await createPurchaseLocal({
        purchase_type: 'local',
        po_number: form.po_number,
        po_date: form.po_date,
        delivery_date: form.shipment_date,
        supplier_id: selectedSupplier!.supplier_id,
        payment_id: paymentSelectedId,
        currency_id: currencySelected ?? '',
        tax_id: taxSelected ?? '',
        exchange_rate_idr: Number(form.exchange_rate_idr) || undefined,
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

  const handleCreateAndSubmit = async () => {
    try {
      validateForm();
      setLoading(true);
      const res = await createPurchaseLocal({
        purchase_type: 'local',
        po_number: form.po_number,
        po_date: form.po_date,
        delivery_date: form.shipment_date,
        supplier_id: selectedSupplier!.supplier_id,
        payment_id: paymentSelectedId,
        currency_id: currencySelected ?? '',
        tax_id: taxSelected ?? '',
        exchange_rate_idr: Number(form.exchange_rate_idr) || undefined,
        notes: form.notes,
        items: buildPayloadItems(),
      });
      const newId = res?.data?.purchase_id ?? res?.purchase_id ?? '';
      if (newId) {
        await processPurchaseLocalAction({ purchase_id: newId, action: 'submit' });
      }
      showSuccess(tr.success_create);
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
      await updatePurchaseLocal({
        purchase_id: localId,
        po_date: form.po_date,
        delivery_date: form.shipment_date,
        supplier_id: selectedSupplier?.supplier_id,
        payment_id: paymentSelectedId || undefined,
        currency_id: currencySelected,
        exchange_rate_idr: Number(form.exchange_rate_idr) || undefined,
        notes: form.notes,
        items: buildPayloadItems(),
      });
      setLocalStatus('draft');
      showSuccess(tr.success_draft);
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAction = async () => {
    try {
      setLoading(true);
      await processPurchaseLocalAction({ purchase_id: localId, action: 'submit' });
      setLocalStatus('submitted');
      showSuccess(tr.success_create);
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await processPurchaseLocalAction({ purchase_id: localId, action: 'approve' });
      setLocalStatus('approved');
      showSuccess('Purchase Order approved.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      setRejectLoading(true);
      await processPurchaseLocalAction({ purchase_id: localId, action: 'reject', notes: reason });
      setLocalStatus('cancelled');
      setIsRejectDialogOpen(false);
      showSuccess('Purchase Order rejected.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setRejectLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; colorPalette: string }> = {
      draft:     { label: 'Draft',     colorPalette: 'yellow' },
      submitted: { label: 'Submitted', colorPalette: 'blue'   },
      approved:  { label: 'Approved',  colorPalette: 'green'  },
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
          <Button bg={BIZGEN_COLOR} color="white" onClick={handleCreateAndSubmit} loading={loading}>
            {tr.submit_purchase}
          </Button>
        </Flex>
      );
    }
    if (localStatus === 'draft' || localStatus === 'cancelled') {
      return (
        <Flex gap={3}>
          <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={handleUpdate} loading={loading}>
            Update
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={handleSubmitAction} loading={loading}>
            Submit
          </Button>
        </Flex>
      );
    }
    if (localStatus === 'submitted' && canApprove) {
      return (
        <Flex gap={3}>
          <Button variant="outline" colorPalette="red" onClick={() => setIsRejectDialogOpen(true)}>
            Reject
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={handleApprove} loading={loading}>
            Approve
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
            {mode === 'view' && statusBadge(localStatus)}
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

      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleReject}
        loading={rejectLoading}
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
                  readOnly={isReadOnly}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.po_date}<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="date"
                  value={form.po_date}
                  onChange={(e) => setForm({ ...form, po_date: e.target.value })}
                  readOnly={isReadOnly}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.shipment_date}<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="date"
                  value={form.shipment_date}
                  onChange={(e) => setForm({ ...form, shipment_date: e.target.value })}
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
                <Field.Label fontSize="sm">{tr.exchange_rate_idr}</Field.Label>
                <Input
                  type="number"
                  value={form.exchange_rate_idr}
                  onChange={(e) => setForm({ ...form, exchange_rate_idr: e.target.value })}
                  placeholder="0"
                  readOnly={isReadOnly}
                />
              </Field.Root>

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
                    setPaymentCollection(paymentMasterAll.filter((p) => contains(p.payment_name, input)));
                  }}
                  disabled={isReadOnly}
                >
                  <Combobox.Control>
                    <Combobox.Input
                      placeholder={tr.payment_method_placeholder}
                      value={paymentSelected}
                      onFocus={() => setPaymentCollection(paymentMasterAll)}
                    />
                    <Combobox.IndicatorGroup>
                      {!isReadOnly && (
                        <Combobox.ClearTrigger onClick={() => { setPaymentSelected(''); setPaymentSelectedId(''); }} />
                      )}
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

              <Field.Root>
                <Field.Label fontSize="sm">{tr.tax}</Field.Label>
                <Select.Root
                  collection={taxCollection}
                  value={taxSelected ? [taxSelected] : []}
                  onValueChange={(d) => handleTaxChange(d.value[0])}
                  disabled={isReadOnly}
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
                readOnly={isReadOnly}
              />
            </Field.Root>
          </Card.Body>
        </Card.Root>

        {/* Purchase Items */}
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Heading size="md">{tr.purchase_items}</Heading>
              {!isReadOnly && (
                <Button size="sm" bg={BIZGEN_COLOR} color="white" onClick={addItem}>
                  {tr.add_item}
                </Button>
              )}
            </Flex>
          </Card.Header>
          <Card.Body>
            <Box overflowX="auto">
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
                      disabled={isReadOnly}
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
                  <Box w="130px" flexShrink={0}>
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
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="wide">
                  {tr.invoice_under}
                </Text>
                {companyProfile ? (
                  <Box lineHeight="tall">
                    {/* <Text fontWeight="bold" fontSize="sm">{companyProfile.company_name}</Text> */}
                    <Text fontSize="sm" color="gray.600" whiteSpace="pre-line">{companyProfile.company_address}</Text>
                    {/* {companyProfile.company_phone && (
                      <Text fontSize="sm" color="gray.600">{companyProfile.company_phone}</Text>
                    )} */}
                  </Box>
                ) : (
                  <Text fontSize="sm" color="gray.400" fontStyle="italic">—</Text>
                )}
              </Box>
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
                  readOnly={isReadOnly}
                />
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* Document Upload */}
        {!isReadOnly && (
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
