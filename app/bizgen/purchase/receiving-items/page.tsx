'use client';

import Loading from '@/components/loading';
import PurchaseOrderLookup, { PurchaseOrderEntry } from '@/components/lookup/PurchaseOrderLookup';
import SupplierLookup from '@/components/lookup/SupplierLookup';
import RejectDialog from '@/components/dialog/RejectDialog';
import { AlertMessage } from '@/components/ui/alert';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { SALES_APPROVAL_ROLES, checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { getAllItem, GetItemData } from '@/lib/master/item';
import { getAllShipVia, GetShipViaData } from '@/lib/master/ship-via';
import { getAllUOM, UOMData } from '@/lib/master/uom';
import { GetSupplierData } from '@/lib/master/supplier';
import { getPurchaseLocalDetail } from '@/lib/purchase/local';
import { getPurchaseImportDetail } from '@/lib/purchase/import';
import {
  createGoodsReceipt,
  generatePurchaseGoodsReceiptNumber,
  getGoodsReceiptDetail,
  updateGoodsReceipt,
  processGoodsReceiptAction,
  GetGoodsReceiptHistoryDetailData,
} from '@/lib/purchase/goods-receipt';
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

type GRMode = 'create' | 'view';

type GRItem = {
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

function newItem(): GRItem {
  return {
    id: crypto.randomUUID(),
    itemId: '', description: '', qty: '', uomId: '', packageSize: '',
    unitPrice: '', total: '0', vatPercent: '0', vatAmount: '0', grandTotal: '0', remarks: '',
  };
}

function calcItem(item: GRItem): GRItem {
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

export default function CreateReceivingItemsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ReceivingItemsContent />
    </Suspense>
  );
}

function ReceivingItemsContent() {
  const searchParams = useSearchParams();
  const receiptId = searchParams.get('receipt_id');

  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const t = getLang(lang);
  const tr = t.receiving_items;

  const canApprove = SALES_APPROVAL_ROLES.has(auth?.app_role_id ?? '');

  const [mode, setMode] = useState<GRMode>('create');
  const [grId, setGrId] = useState('');
  const [grStatus, setGrStatus] = useState('');
  const [historyData, setHistoryData] = useState<GetGoodsReceiptHistoryDetailData[]>([]);
  const [poLocalId, setPoLocalId] = useState('');
  const [poImportId, setPoImportId] = useState('');
  const [poDisplayText, setPoDisplayText] = useState('');

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

  const [uomOptions, setUomOptions] = useState<UOMData[]>([]);
  const [shipViaOptions, setShipViaOptions] = useState<GetShipViaData[]>([]);
  const [itemMasterAll, setItemMasterAll] = useState<GetItemData[]>([]);

  const uomCollection = createListCollection({
    items: uomOptions.map((u) => ({ label: u.uom_name, value: u.uom_id })),
  });
  const shipViaCollection = createListCollection({
    items: shipViaOptions.map((s) => ({ label: s.ship_via_name, value: s.ship_via_id })),
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
  const purchaseOrderLocalId = selectedPO?.purchase_type === 'local' ? selectedPO.purchase_id : poLocalId;
  const purchaseOrderImportId = selectedPO?.purchase_type === 'import' ? selectedPO.purchase_id : poImportId;

  const [shipViaSelected, setShipViaSelected] = useState<string>();

  const [form, setForm] = useState({
    gr_number: '',
    receiving_date: '',
    address: '',
    ship_date: '',
    notes: '',
  });

  const [items, setItems] = useState<GRItem[]>([newItem()]);

  const isReadOnly = mode === 'view' && (grStatus === 'posted' || grStatus === 'submitted');

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if (!valid) return;

        const info = getAuthInfo();
        setAuth(info);
        setLang(info?.language === 'id' ? 'id' : 'en');

        const [uomRes, shipViaRes, itemRes] = await Promise.all([
          getAllUOM(1, 1000),
          getAllShipVia(1, 1000),
          getAllItem(1, 1000),
        ]);

        const uomData = uomRes?.data ?? [];
        const shipViaData = shipViaRes?.data ?? [];
        const itemData = itemRes?.data ?? [];

        setUomOptions(uomData);
        setShipViaOptions(shipViaData);
        setItemMasterAll(itemData);
        setItemCollection(itemData);

        if (receiptId) {
          setMode('view');
          const detail = await getGoodsReceiptDetail(receiptId);
          const h = detail.header;

          setGrId(h.receipt_id);
          setGrStatus(h.status);
          setHistoryData(detail.history);
          setPoLocalId(h.purchase_id_local ?? '');
          setPoImportId(h.purchase_id_import ?? '');

          if (h.purchase_id_local) {
            try {
              const localPO = await getPurchaseLocalDetail(h.purchase_id_local);
              setPoDisplayText(`[LOCAL] ${localPO.header.po_number}`);
            } catch {}
          } else if (h.purchase_id_import) {
            try {
              const importPO = await getPurchaseImportDetail(h.purchase_id_import);
              setPoDisplayText(`[IMPORT] ${importPO.header.po_number}`);
            } catch {}
          }

          setForm((prev) => ({
            ...prev,
            gr_number: h.receipt_number,
            receiving_date: h.receipt_date,
            ship_date: h.send_date ?? '',
            address: h.send_address ?? '',
            notes: h.remarks ?? '',
          }));

          const shipVia = shipViaData.find((s) => s.ship_via_name === h.ship_via_name);
          if (shipVia) setShipViaSelected(shipVia.ship_via_id);

          setSelectedSupplier({ supplier_name: h.supplier_name } as GetSupplierData);

          setItems(
            detail.items.map((item) => {
              const uom = uomData.find((u) => u.uom_name === item.uom_name);
              const qty = item.qty_received ?? '0';
              const price = item.unit_cost ?? '0';
              const total = parseFloat(qty) * parseFloat(price);
              const vatAmount = parseFloat(item.tax_amount ?? '0');
              const vatPercent = item.tax_rate
                ? item.tax_rate
                : total > 0
                ? ((vatAmount / total) * 100).toFixed(2)
                : '0';
              return {
                id: crypto.randomUUID(),
                itemId: item.item_id,
                description: item.item_name,
                qty,
                uomId: uom?.uom_id ?? '',
                packageSize: item.packaging_size ?? '',
                unitPrice: price,
                total: total.toFixed(2),
                vatPercent,
                vatAmount: vatAmount.toFixed(2),
                grandTotal: (total + vatAmount).toFixed(2),
                remarks: item.notes ?? '',
              };
            })
          );
        } else {
          const numberRes = await generatePurchaseGoodsReceiptNumber();
          setForm((prev) => ({ ...prev, gr_number: numberRes.number }));
        }
      } catch (err) {
        console.error('Failed to initialize:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [receiptId]);

  const handleItemChange = (id: string, field: keyof GRItem, value: string) => {
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

  const handleChoosePO = async (entry: PurchaseOrderEntry) => {
    setSelectedPO(entry);
    setPoDisplayText(`[${entry.purchase_type.toUpperCase()}] ${entry.po_number}`);
    setPoLookupOpen(false);
    try {
      setLoading(true);
      if (entry.purchase_type === 'local') {
        const detail = await getPurchaseLocalDetail(entry.purchase_id);
        const h = detail.header;
        if (h.supplier_id) {
          setSelectedSupplier({ supplier_id: h.supplier_id, supplier_name: h.supplier_name } as GetSupplierData);
        }
        setItems(
          detail.items.map((pi) => {
            const uom = uomOptions.find((u) => u.uom_name === pi.uom_name);
            return calcItem({
              id: crypto.randomUUID(),
              itemId: pi.item_id,
              description: pi.item_name,
              qty: pi.qty,
              uomId: uom?.uom_id ?? '',
              packageSize: '',
              unitPrice: pi.unit_price,
              total: '0', vatPercent: '0', vatAmount: '0', grandTotal: '0',
              remarks: pi.remarks ?? '',
            });
          })
        );
      } else {
        const detail = await getPurchaseImportDetail(entry.purchase_id);
        const h = detail.header;
        if (h.supplier_id) {
          setSelectedSupplier({ supplier_id: h.supplier_id, supplier_name: h.supplier_name } as GetSupplierData);
        }
        setItems(
          detail.items.map((pi) => {
            const uom = uomOptions.find((u) => u.uom_name === pi.uom_name);
            return calcItem({
              id: crypto.randomUUID(),
              itemId: pi.item_id,
              description: pi.item_name,
              qty: pi.qty,
              uomId: uom?.uom_id ?? '',
              packageSize: pi.packaging_size ?? '',
              unitPrice: pi.unit_price,
              total: '0', vatPercent: '0', vatAmount: '0', grandTotal: '0',
              remarks: pi.description ?? '',
            });
          })
        );
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load PO details');
    } finally {
      setLoading(false);
    }
  };

  const buildPayloadItems = () =>
    items.map(({ id: _id, ...rest }) => ({
      item_id: rest.itemId,
      qty_received: Number(rest.qty),
      unit_cost: Number(rest.unitPrice),
      uom_id: rest.uomId,
      packaging_size: rest.packageSize,
      tax_amount: Number(rest.vatAmount),
      notes: rest.remarks,
    }));

  const validateForm = () => {
    if (!form.gr_number) throw new Error(tr.error_gr_number);
    if (!selectedSupplier?.supplier_id) throw new Error(tr.error_supplier);
    if (!form.receiving_date) throw new Error(tr.error_receiving_date);
    if (!selectedPO && !poLocalId && !poImportId) throw new Error(tr.error_po);
    if (items.length === 0) throw new Error(tr.error_items);
    if (items.some((i) => !i.itemId)) throw new Error(tr.error_item_id);
    if (items.some((i) => Number(i.qty) <= 0)) throw new Error(tr.error_item_qty);
    if (items.some((i) => !i.uomId)) throw new Error(tr.error_item_uom);
  };

  const resetForm = async () => {
    const res = await generatePurchaseGoodsReceiptNumber();
    setForm({ gr_number: res.number, receiving_date: '', address: '', ship_date: '', notes: '' });
    setSelectedSupplier(null);
    setSelectedPO(null);
    setPoDisplayText('');
    setShipViaSelected(undefined);
    setItems([newItem()]);
  };

  const handleSaveDraft = async () => {
    try {
      validateForm();
      setLoading(true);
      await createGoodsReceipt({
        receipt_number: form.gr_number,
        receipt_date: form.receiving_date,
        purchase_id_local: purchaseOrderLocalId,
        purchase_id_import: purchaseOrderImportId,
        supplier_id: selectedSupplier!.supplier_id,
        send_date: form.ship_date,
        ship_via_id: shipViaSelected ?? '',
        send_address: form.address,
        remarks: form.notes,
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

  const handlePostGR = async () => {
    try {
      validateForm();
      setLoading(true);
      const res = await createGoodsReceipt({
        receipt_number: form.gr_number,
        receipt_date: form.receiving_date,
        purchase_id_local: purchaseOrderLocalId,
        purchase_id_import: purchaseOrderImportId,
        supplier_id: selectedSupplier!.supplier_id,
        send_date: form.ship_date,
        ship_via_id: shipViaSelected ?? '',
        send_address: form.address,
        remarks: form.notes,
        items: buildPayloadItems(),
      });
      const newId = res?.data?.receipt_id ?? res?.receipt_id ?? '';
      if (newId) {
        await processGoodsReceiptAction({ receipt_id: newId, action: 'submit' });
      }
      showSuccess(tr.success_create);
      await resetForm();
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = async () => {
    if (!grId) return;
    const detail = await getGoodsReceiptDetail(grId);
    setHistoryData(detail.history);
  };

  const handleSubmitGR = async () => {
    try {
      setLoading(true);
      await processGoodsReceiptAction({ receipt_id: grId, action: 'submit' });
      setGrStatus('submitted');
      await refreshHistory();
      showSuccess('Goods Receipt submitted for approval.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updateGoodsReceipt({
        receipt_id: grId,
        receipt_date: form.receiving_date,
        supplier_id: selectedSupplier?.supplier_id,
        ship_via_id: shipViaSelected,
        send_date: form.ship_date,
        send_address: form.address,
        remarks: form.notes,
        purchase_id_local: poLocalId || undefined,
        purchase_id_import: poImportId || undefined,
        items: buildPayloadItems(),
      });
      setGrStatus('draft');
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
      await processGoodsReceiptAction({ receipt_id: grId, action: 'approve' });
      setGrStatus('posted');
      await refreshHistory();
      showSuccess('Goods Receipt approved and posted.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      setRejectLoading(true);
      await processGoodsReceiptAction({ receipt_id: grId, action: 'reject', notes: reason });
      setGrStatus('cancelled');
      setIsRejectDialogOpen(false);
      await refreshHistory();
      showSuccess('Goods Receipt rejected.');
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
          <Button bg={BIZGEN_COLOR} color="white" onClick={handlePostGR} loading={loading}>
            {tr.post_gr}
          </Button>
        </Flex>
      );
    }
    if (grStatus === 'draft') {
      return (
        <Flex gap={3}>
          <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={handleUpdate} loading={loading}>
            {t.master.save}
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={handleSubmitGR} loading={loading}>
            {t.master.submit}
          </Button>
        </Flex>
      );
    }
    if (grStatus === 'submitted') {
      return (
        <Flex gap={3}>
          {canApprove && (
            <Button variant="outline" colorPalette="red" onClick={() => setIsRejectDialogOpen(true)}>
              {t.master.reject}
            </Button>
          )}
          {canApprove && (
            <Button backgroundColor="green" color="white" onClick={handleApprove} loading={loading}>
              {t.master.approve}
            </Button>
          )}
        </Flex>
      );
    }
    if (grStatus === 'cancelled') {
      return (
        <Flex gap={3}>
          <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={handleUpdate} loading={loading}>
            {t.master.save}
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
            {mode === 'view' && statusBadge(grStatus)}
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
        {/* GR Details */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">{tr.gr_details}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root required>
                <Field.Label fontSize="sm">{tr.gr_number}<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={form.gr_number}
                  onChange={(e) => setForm({ ...form, gr_number: e.target.value })}
                  placeholder={tr.gr_number_placeholder}
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

              <Field.Root required>
                <Field.Label fontSize="sm">{tr.po_number}<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={poDisplayText}
                  readOnly
                  cursor={isReadOnly ? 'default' : 'pointer'}
                  placeholder={tr.po_number_placeholder}
                  onClick={() => !isReadOnly && setPoLookupOpen(true)}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label fontSize="sm">{tr.receiving_date}<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="date"
                  value={form.receiving_date}
                  onChange={(e) => setForm({ ...form, receiving_date: e.target.value })}
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
                <Field.Label fontSize="sm">{tr.ship_via}</Field.Label>
                <Select.Root
                  collection={shipViaCollection}
                  value={shipViaSelected ? [shipViaSelected] : []}
                  onValueChange={(d) => setShipViaSelected(d.value[0])}
                  disabled={isReadOnly}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={tr.ship_via_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {shipViaCollection.items.map((s) => (
                          <Select.Item item={s} key={s.value}>{s.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={4}>
              <Field.Root>
                <Field.Label fontSize="sm">{tr.address}</Field.Label>
                <Textarea rows={3} value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder={tr.address_placeholder} readOnly={isReadOnly} />
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm">{tr.notes}</Field.Label>
                <Textarea rows={3} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder={tr.notes_placeholder} readOnly={isReadOnly} />
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* Items Received */}
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Heading size="md">{tr.items_received}</Heading>
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
                  ['130px', tr.unit_price],
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
                  <Box w="130px" flexShrink={0}>
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
                    <Text fontSize="sm" color="gray.600">{tr.subtotal}</Text>
                    <Text fontSize="sm" fontWeight="semibold">{fmt(totalSubtotal)}</Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" color="gray.600">{tr.total_vat}</Text>
                    <Text fontSize="sm" fontWeight="semibold">{fmt(totalVat)}</Text>
                  </Flex>
                  <Separator mb={2} />
                  <Flex justify="space-between">
                    <Text fontWeight="bold">{tr.total_grand}</Text>
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
