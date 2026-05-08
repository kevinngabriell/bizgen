'use client';

import Loading from '@/components/loading';
import CustomerLookup from '@/components/lookup/CustomerLookup';
import RejectDialog from '@/components/dialog/RejectDialog';
import { AlertMessage } from '@/components/ui/alert';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { SALES_APPROVAL_ROLES, checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { getAllCurrency, GetCurrencyData } from '@/lib/master/currency';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { getAllPort, GetPortData } from '@/lib/master/port';
import { getAllBankAccount, GetBankAccountData } from '@/lib/master/bank-account';
import { getAllPaymentMethod, GetPaymentMethodData } from '@/lib/master/payment-method';
import { GetCustomerData, getDetailCustomer } from '@/lib/master/customer';
import {
  GetSalesOrderItemData,
  GetDetailSalesOrderResponse,
  getSalesOrderByCustomer,
  getDetailSalesOrder,
} from '@/lib/sales/sales-order';
import {
  generateInvoiceNumber,
  createInvoice,
  updateInvoice,
  submitInvoice,
  approveInvoice,
  rejectInvoice,
  getInvoiceDetail,
  CreateInvoiceData,
  UpdateInvoiceData,
} from '@/lib/finance/invoice';
import {
  Badge, Box, Button, Card, Checkbox, createListCollection,
  Field, Flex, Heading, Icon, IconButton, Input, Portal,
  Select, Separator, SimpleGrid, Stack, Spinner, Table, Text, Textarea,
} from '@chakra-ui/react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaTrash } from 'react-icons/fa';
import { FiFileText, FiUpload, FiX } from 'react-icons/fi';

const BIZGEN_COLOR = '#E77A1F';

type InvoiceMode = 'create' | 'view';

type InvoiceItem = {
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

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={<Loading />}>
      <CreateInvoiceContent />
    </Suspense>
  );
}

function CreateInvoiceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [termOptions, setTermOptions] = useState<GetTermData[]>([]);
  const [portOptions, setPortOptions] = useState<GetPortData[]>([]);
  const [bankAccountOptions, setBankAccountOptions] = useState<GetBankAccountData[]>([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<GetPaymentMethodData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((c) => ({ label: `${c.currency_code} — ${c.currency_name}`, value: c.currency_id })),
  });
  const termCollection = createListCollection({
    items: termOptions.map((tm) => ({ label: tm.term_name, value: tm.term_id })),
  });
  const portCollection = createListCollection({
    items: portOptions.map((p) => ({ label: `${p.port_name} — ${p.origin_name}`, value: p.port_id })),
  });
  const bankAccountCollection = createListCollection({
    items: bankAccountOptions.map((b) => ({
      label: `${b.bank_name} — ${b.bank_number}${b.bank_branch ? ` (${b.bank_branch})` : ''}`,
      value: b.bank_account_id,
    })),
  });
  const paymentMethodCollection = createListCollection({
    items: paymentMethodOptions.map((p) => ({ label: p.payment_name, value: p.payment_id })),
  });

  // Customer & SO
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<GetCustomerData | null>(null);
  const [unpaidSOList, setUnpaidSOList] = useState<GetSalesOrderItemData[]>([]);
  const [soLoading, setSOLoading] = useState(false);
  const [linkedSO, setLinkedSO] = useState<GetSalesOrderItemData | null>(null);

  // Form
  const [form, setForm] = useState({
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    exchange_rate: '',
    notes: '',
    vessel_flight: '',
    bl_awb_number: '',
    etd: '',
    eta: '',
    cheque_number: '',
    cheque_date: '',
    cheque_amount: '',
    form_number: '',
  });

  const [currencySelected, setCurrencySelected] = useState<string>();
  const [termSelected, setTermSelected] = useState<string>();
  const [originSelected, setOriginSelected] = useState<string>();
  const [destinationSelected, setDestinationSelected] = useState<string>();
  const [bankAccountSelected, setBankAccountSelected] = useState<string>();
  const [paymentMethodSelected, setPaymentMethodSelected] = useState<string>();

  // Line items (auto-populated from SO)
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Payment type
  const [paymentType, setPaymentType] = useState<'full' | 'installment'>('full');
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [focusedInstallmentId, setFocusedInstallmentId] = useState<string | null>(null);

  // Document upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const isReadOnly = mode === 'view' && (invStatus === 'posted' || invStatus === 'submitted');
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

        const [currencyRes, termRes, portRes, bankRes, paymentRes] = await Promise.all([
          getAllCurrency(1, 1000),
          getAllTerm(1, 1000),
          getAllPort(1, 1000),
          getAllBankAccount(1, 1000),
          getAllPaymentMethod(1, 1000),
        ]);

        setCurrencyOptions(currencyRes?.data ?? []);
        setTermOptions(termRes?.data ?? []);
        setPortOptions(portRes?.data ?? []);
        setBankAccountOptions(bankRes?.data ?? []);
        setPaymentMethodOptions(paymentRes?.data ?? []);

        if (!invoiceId) {
          const todayStr = new Date().toISOString().split('T')[0];
          const numberRes = await generateInvoiceNumber();
          setForm((prev) => ({
            ...prev,
            invoice_number: numberRes.number,
            invoice_date: todayStr,
            cheque_date: todayStr,
          }));
        } else {
          setMode('view');
          const detail = await getInvoiceDetail(invoiceId);
          const h = detail.header;
          setInvStatus(h.status);
          setForm({
            invoice_number: h.invoice_no,
            invoice_date: h.invoice_date,
            due_date: h.due_date ?? '',
            exchange_rate: h.exchange_rate && h.exchange_rate !== 1 ? h.exchange_rate.toString() : '',
            notes: h.notes ?? '',
            vessel_flight: h.vessel_flight ?? '',
            bl_awb_number: h.bl_awb_number ?? '',
            etd: h.etd ?? '',
            eta: h.eta ?? '',
            cheque_number: h.cheque_number ?? '',
            cheque_date: h.cheque_date ?? '',
            cheque_amount: h.cheque_amount?.toString() ?? '',
            form_number: h.form_number ?? '',
          });
          setCurrencySelected(h.currency_id);
          setTermSelected(h.term_id);
          setOriginSelected(h.origin_port_id);
          setDestinationSelected(h.destination_port_id);
          setBankAccountSelected(h.bank_account_id);
          setPaymentMethodSelected(h.payment_method_id);
          setPaymentType(h.payment_type);
          const customerRes = await getDetailCustomer(h.customer_id);
          setSelectedCustomer(customerRes.data[0] ?? {
            customer_id: h.customer_id,
            customer_name: h.customer_name,
          } as any);
          setLinkedSO({
            sales_order_id: h.sales_order_id,
            sales_order_no: h.sales_order_no,
            created_at: '',
          });
          setItems(detail.items.map((di) => ({
            id: di.invoice_item_id,
            itemId: di.item_ref_id,
            description: di.description,
            qty: di.quantity.toString(),
            uomName: di.uom_name,
            unitPrice: di.unit_price.toString(),
            total: di.line_subtotal.toString(),
            vatPercent: di.tax_percent.toString(),
            vatAmount: di.tax_amount.toString(),
            grandTotal: di.line_total.toString(),
          })));
          if (h.payment_type === 'installment') {
            setInstallments(detail.installments.map((inst) => ({
              id: inst.installment_id,
              dueDate: inst.due_date,
              amount: inst.amount.toString(),
              isPaid: Number(inst.is_paid) === 1,
              paidDate: inst.paid_date ?? '',
              notes: inst.notes ?? '',
            })));
          }
          setHistoryData(detail.history.map((entry) => ({
            action: entry.action,
            note: entry.description,
            created_by: entry.created_by,
            created_at: entry.created_at,
          })));
        }
      } catch (err) {
        console.error('Failed to initialize:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [invoiceId]);

  // ─── Customer & SO handlers ───────────────────────────────────────────────

  const handleChooseCustomer = (customer: GetCustomerData) => {
    setSelectedCustomer(customer);
    setCustomerModalOpen(false);
    setLinkedSO(null);
    setItems([]);
    setUnpaidSOList([]);

    if (customer.customer_top && form.invoice_date) {
      const due = new Date(form.invoice_date);
      due.setDate(due.getDate() + customer.customer_top);
      setForm((prev) => ({ ...prev, due_date: due.toISOString().split('T')[0] }));
    }

    fetchUnpaidSOs(customer.customer_id);
  };

  const fetchUnpaidSOs = async (customerId: string) => {
    setSOLoading(true);
    try {
      const { data } = await getSalesOrderByCustomer(customerId);
      setUnpaidSOList(data);
    } catch {
      setUnpaidSOList([]);
    } finally {
      setSOLoading(false);
    }
  };

  const handleSelectSO = async (so: GetSalesOrderItemData) => {
    setLinkedSO(so);
    try {
      setLoading(true);
      const detail: GetDetailSalesOrderResponse = await getDetailSalesOrder(so.sales_order_id);
      const mappedItems: InvoiceItem[] = detail.items.map((soItem) => {
        const dpp = soItem.dpp ?? 0;
        const ppn = soItem.ppn ?? 0;
        const vatPct = dpp > 0 ? ((ppn / dpp) * 100).toFixed(0) : '0';
        return {
          id: crypto.randomUUID(),
          itemId: soItem.item_id || '',
          description: soItem.item_name,
          qty: soItem.quantity.toString(),
          uomName: soItem.uom_name,
          unitPrice: soItem.unit_price.toString(),
          total: dpp.toString(),
          vatPercent: vatPct,
          vatAmount: ppn.toString(),
          grandTotal: soItem.total.toString(),
        };
      });
      setItems(mappedItems);
    } catch (err) {
      console.error(err);
      showError('Failed to load sales order details.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSO = () => {
    setLinkedSO(null);
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
    if (!form.invoice_number) throw new Error('Invoice number is required');
    if (!form.invoice_date) throw new Error('Invoice date is required');
    if (!selectedCustomer?.customer_id) throw new Error('Customer is required');
    if (!linkedSO?.sales_order_id) throw new Error('Sales order is required');
    if (!currencySelected) throw new Error('Currency is required');
    if (!isIDR && (!form.exchange_rate || Number(form.exchange_rate) <= 0)) throw new Error('Exchange rate is required for non-IDR currency');
    if (!termSelected) throw new Error('Payment term / Incoterm is required');
    if (items.length === 0) throw new Error('Sales order must have at least one item');
    if (paymentType === 'installment' && installments.length > 0) {
      if (Math.abs(totalScheduled - totalGrand) > 0.01) {
        throw new Error(`Payment schedule total (${fmt(totalScheduled)}) must match invoice grand total (${fmt(totalGrand)})`);
      }
    }
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  const buildPayload = (): CreateInvoiceData => {
    const exchangeRate = isIDR ? 1 : parseFloat(form.exchange_rate) || 1;
    return {
      invoice_no: form.invoice_number,
      form_number: form.form_number || undefined,
      invoice_date: form.invoice_date,
      due_date: form.due_date,
      customer_id: selectedCustomer!.customer_id,
      sales_order_id: linkedSO!.sales_order_id,
      currency_id: currencySelected!,
      exchange_rate: exchangeRate,
      term_id: termSelected,
      payment_type: paymentType,
      bank_account_id: bankAccountSelected,
      payment_method_id: paymentMethodSelected,
      cheque_number: form.cheque_number || undefined,
      cheque_date: form.cheque_date || undefined,
      cheque_amount: form.cheque_amount ? parseFloat(form.cheque_amount) : undefined,
      origin_port_id: originSelected,
      destination_port_id: destinationSelected,
      vessel_flight: form.vessel_flight || undefined,
      bl_awb_number: form.bl_awb_number || undefined,
      etd: form.etd || undefined,
      eta: form.eta || undefined,
      subtotal_amount: totalSubtotal,
      tax_amount: totalVat,
      total_amount: totalGrand,
      total_amount_idr: totalGrand * exchangeRate,
      notes: form.notes || undefined,
      items: items.map((item, idx) => ({
        item_ref_id: item.itemId,
        description: item.description,
        quantity: parseFloat(item.qty) || 0,
        uom_name: item.uomName,
        unit_price: parseFloat(item.unitPrice) || 0,
        line_subtotal: parseFloat(item.total) || 0,
        tax_percent: parseFloat(item.vatPercent) || 0,
        tax_amount: parseFloat(item.vatAmount) || 0,
        line_total: parseFloat(item.grandTotal) || 0,
        sort_order: idx + 1,
      })),
      installments: paymentType === 'installment'
        ? installments.map((inst, idx) => ({
            installment_number: idx + 1,
            due_date: inst.dueDate,
            amount: parseFloat(inst.amount) || 0,
            notes: inst.notes || undefined,
          }))
        : undefined,
    };
  };

  const resetForm = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const numberRes = await generateInvoiceNumber();
    setForm({
      invoice_number: numberRes.number,
      invoice_date: todayStr,
      due_date: '',
      exchange_rate: '',
      notes: '',
      vessel_flight: '',
      bl_awb_number: '',
      etd: '',
      eta: '',
      cheque_number: '',
      cheque_date: todayStr,
      cheque_amount: '',
      form_number: '',
    });
    setSelectedCustomer(null);
    setUnpaidSOList([]);
    setLinkedSO(null);
    setItems([]);
    setInstallments([]);
    setPaymentType('full');
    setCurrencySelected(undefined);
    setTermSelected(undefined);
    setOriginSelected(undefined);
    setDestinationSelected(undefined);
    setBankAccountSelected(undefined);
    setPaymentMethodSelected(undefined);
    setUploadedFiles([]);
  };

  const handleSaveDraft = async () => {
    try {
      validateForm();
      setLoading(true);
      const payload = buildPayload();
      await createInvoice(payload);
      await resetForm();
      showSuccess('Sales invoice saved as draft.');
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
      const payload = buildPayload();
      const res = await createInvoice(payload);
      await submitInvoice(res.data.invoice_id);
      await resetForm();
      showSuccess('Sales invoice submitted for approval.');
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
      const exchangeRate = isIDR ? 1 : parseFloat(form.exchange_rate) || 1;
      const updatePayload: UpdateInvoiceData = {
        invoice_id: invoiceId!,
        invoice_date: form.invoice_date,
        due_date: form.due_date,
        form_number: form.form_number || undefined,
        term_id: termSelected,
        payment_type: paymentType,
        bank_account_id: bankAccountSelected,
        payment_method_id: paymentMethodSelected,
        cheque_number: form.cheque_number || undefined,
        cheque_date: form.cheque_date || undefined,
        cheque_amount: form.cheque_amount ? parseFloat(form.cheque_amount) : undefined,
        origin_port_id: originSelected,
        destination_port_id: destinationSelected,
        vessel_flight: form.vessel_flight || undefined,
        bl_awb_number: form.bl_awb_number || undefined,
        etd: form.etd || undefined,
        eta: form.eta || undefined,
        subtotal_amount: totalSubtotal,
        tax_amount: totalVat,
        total_amount: totalGrand,
        total_amount_idr: totalGrand * exchangeRate,
        notes: form.notes || undefined,
        items: items.map((item, idx) => ({
          item_ref_id: item.itemId,
          description: item.description,
          quantity: parseFloat(item.qty) || 0,
          uom_name: item.uomName,
          unit_price: parseFloat(item.unitPrice) || 0,
          line_subtotal: parseFloat(item.total) || 0,
          tax_percent: parseFloat(item.vatPercent) || 0,
          tax_amount: parseFloat(item.vatAmount) || 0,
          line_total: parseFloat(item.grandTotal) || 0,
          sort_order: idx + 1,
        })),
        installments: paymentType === 'installment'
          ? installments.map((inst, idx) => ({
              installment_number: idx + 1,
              due_date: inst.dueDate,
              amount: parseFloat(inst.amount) || 0,
              notes: inst.notes || undefined,
            }))
          : undefined,
      };
      await updateInvoice(updatePayload);
      setInvStatus('draft');
      showSuccess('Sales invoice updated successfully.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAction = async () => {
    try {
      setLoading(true);
      await submitInvoice(invoiceId!);
      setInvStatus('submitted');
      showSuccess('Sales invoice submitted for approval.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await approveInvoice(invoiceId!);
      setInvStatus('posted');
      showSuccess('Sales invoice approved and posted.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      setRejectLoading(true);
      await rejectInvoice(invoiceId!, reason);
      setInvStatus('cancelled');
      setIsRejectDialogOpen(false);
      showSuccess('Sales invoice rejected.');
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setRejectLoading(false);
    }
  };

  // ─── Status badge ──────────────────────────────────────────────────────────

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; colorPalette: string }> = {
      draft:     { label: t.finance_invoice.status_draft,     colorPalette: 'yellow' },
      submitted: { label: t.finance_invoice.status_submitted, colorPalette: 'blue'   },
      posted:    { label: t.finance_invoice.status_posted,    colorPalette: 'green'  },
      cancelled: { label: t.finance_invoice.status_cancelled, colorPalette: 'red'    },
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
            {t.finance_invoice.save_draft}
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={handlePostInvoice} loading={loading}>
            {t.finance_invoice.post_invoice}
          </Button>
        </Flex>
      );
    }
    if (invStatus === 'draft' || invStatus === 'cancelled') {
      return (
        <Flex gap={3}>
          <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={handleUpdate} loading={loading}>
            {t.finance_invoice.save}
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={handleSubmitAction} loading={loading}>
            {t.finance_invoice.submit}
          </Button>
        </Flex>
      );
    }
    if (invStatus === 'submitted' && canApprove) {
      return (
        <Flex gap={3}>
          <Button variant="outline" colorPalette="red" onClick={() => setIsRejectDialogOpen(true)}>
            {t.finance_invoice.reject}
          </Button>
          <Button bg="green.500" color="white" onClick={handleApprove} loading={loading}>
            {t.finance_invoice.approve}
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
              {mode === 'create' ? t.finance_invoice.title_create : t.finance_invoice.title_view}
            </Heading>
            {mode === 'view' && statusBadge(invStatus)}
          </Flex>
          <Text color="gray.500" fontSize="sm">
            {t.finance_invoice.subtitle}
          </Text>
        </Flex>
        <ActionButtons />
      </Flex>

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

      <CustomerLookup
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onChoose={handleChooseCustomer}
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
            <Heading size="md">{t.finance_invoice.invoice_details}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>

              <Field.Root required>
                <Field.Label fontSize="sm">{t.finance_invoice.invoice_no}<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  placeholder="SI/2026/04/0001"
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label fontSize="sm">{t.finance_invoice.invoice_date}<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="date"
                  value={form.invoice_date}
                  onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{t.finance_invoice.form_no}</Field.Label>
                <Input
                  value={form.form_number}
                  onChange={(e) => setForm({ ...form, form_number: e.target.value })}
                  placeholder="Insert Form Number"
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label fontSize="sm">{t.finance_invoice.bill_to}<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={selectedCustomer?.customer_name ?? ''}
                  readOnly
                  cursor={isReadOnly ? 'default' : 'pointer'}
                  placeholder="Click to select customer"
                  onClick={() => !isReadOnly && setCustomerModalOpen(true)}
                  _hover={!isReadOnly ? { borderColor: BIZGEN_COLOR } : {}}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{t.finance_invoice.customer_info}</Field.Label>
                <Box fontSize="xs" color="gray.500" lineHeight="short" pt={1}>
                  {selectedCustomer ? (
                    <>
                      <Text>{selectedCustomer.customer_address || '—'}</Text>
                      <Text>PIC: {selectedCustomer.customer_pic_name || '—'}</Text>
                      <Text>Phone: {selectedCustomer.customer_phone || '—'}</Text>
                      {selectedCustomer.customer_top > 0 && (
                        <Text>TOP: {selectedCustomer.customer_top} days</Text>
                      )}
                    </>
                  ) : (
                    <Text color="gray.400" fontStyle="italic">{t.finance_invoice.no_customer_selected}</Text>
                  )}
                </Box>
              </Field.Root>

              <Field.Root required>
                <Field.Label fontSize="sm">{t.finance_invoice.currency}<Field.RequiredIndicator /></Field.Label>
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
                  <Field.Label fontSize="sm">{t.finance_invoice.exchange_rate}<Field.RequiredIndicator /></Field.Label>
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
                <Field.Label fontSize="sm">{t.finance_invoice.payment_term}<Field.RequiredIndicator /></Field.Label>
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

              <Field.Root>
                <Field.Label fontSize="sm">{t.finance_invoice.due_date}</Field.Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  readOnly={isReadOnly}
                />
              </Field.Root>

            </SimpleGrid>

            <Field.Root mt={4}>
              <Field.Label fontSize="sm">{t.finance_invoice.notes_remarks}</Field.Label>
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

        {/* ── Unpaid Sales Orders ──────────────────────────────────────────── */}
        <Card.Root>
          <Card.Header>
            <Flex flexDir="column">
              <Heading size="md">{t.finance_invoice.sales_orders}</Heading>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {selectedCustomer
                  ? `${t.finance_invoice.unpaid_sales_orders_for} ${selectedCustomer.customer_name}`
                  : t.finance_invoice.select_customer_first}
              </Text>
            </Flex>
          </Card.Header>
          <Card.Body>
            {!selectedCustomer ? (
              <Flex
                align="center" justify="center" direction="column" gap={2} py={8}
                borderRadius="lg" border="1px dashed" borderColor="gray.200"
                textAlign="center" color="gray.400"
              >
                <Text fontSize="sm">{t.finance_invoice.no_customer_selected}</Text>
                <Text fontSize="xs">{t.finance_invoice.select_customer_first}</Text>
              </Flex>
            ) : soLoading ? (
              <Flex align="center" justify="center" py={8} gap={3}>
                <Spinner size="sm" color={BIZGEN_COLOR} />
                <Text fontSize="sm" color="gray.500">{t.finance_invoice.loading_so}</Text>
              </Flex>
            ) : unpaidSOList.length === 0 ? (
              <Flex
                align="center" justify="center" direction="column" gap={2} py={8}
                borderRadius="lg" border="1px dashed" borderColor="gray.200"
                textAlign="center" color="gray.400"
              >
                <Text fontSize="sm">{t.finance_invoice.no_so_found}</Text>
                <Text fontSize="xs">{t.finance_invoice.no_so_found_desc}</Text>
              </Flex>
            ) : (
              <Box>
                {linkedSO && (
                  <Flex align="center" gap={2} mb={4} px={3} py={2}
                    borderRadius="md" bg="orange.50" border="1px solid" borderColor="orange.200"
                  >
                    <Text fontSize="sm" fontWeight="semibold" color={BIZGEN_COLOR}>
                      Selected: {linkedSO.sales_order_no}
                    </Text>
                    {!isReadOnly && (
                      <IconButton
                        aria-label="Clear SO selection"
                        variant="ghost"
                        size="xs"
                        color="gray.500"
                        onClick={handleClearSO}
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
                      <Table.ColumnHeader>{t.finance_invoice.so_number}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t.finance_invoice.so_date}</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">{t.finance_invoice.so_action}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {unpaidSOList.map((so) => {
                      const isSelected = linkedSO?.sales_order_id === so.sales_order_id;
                      return (
                        <Table.Row
                          key={so.sales_order_id}
                          bg={isSelected ? 'orange.50' : undefined}
                          _hover={{ bg: isSelected ? 'orange.50' : 'gray.50' }}
                        >
                          <Table.Cell fontWeight={isSelected ? 'semibold' : 'normal'}>
                            {so.sales_order_no}
                          </Table.Cell>
                          <Table.Cell color="gray.500" fontSize="sm">
                            {so.created_at ? new Date(so.created_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            }) : '—'}
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            {isSelected ? (
                              <Badge colorPalette="orange" variant="subtle">{t.finance_invoice.so_selected}</Badge>
                            ) : (
                              !isReadOnly && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  color={BIZGEN_COLOR}
                                  borderColor={BIZGEN_COLOR}
                                  onClick={() => handleSelectSO(so)}
                                >
                                  {t.finance_invoice.select_so}
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

        {/* ── Invoice Items (from selected SO) ────────────────────────────── */}
        <Card.Root>
          <Card.Header>
            <Flex flexDir="column">
              <Heading size="md">{t.finance_invoice.invoice_items}</Heading>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {t.finance_invoice.items_from_so}
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
                <Text fontSize="sm">{t.finance_invoice.no_items_loaded}</Text>
                <Text fontSize="xs">{t.finance_invoice.select_so_first}</Text>
              </Flex>
            ) : (
              <Box overflowX="auto">
                <Flex minW="1100px" gap={3} mb={2} px={1}>
                  {([
                    ['32px',  '#'],
                    ['240px', t.finance_invoice.item_description],
                    ['80px',  t.finance_invoice.qty],
                    ['100px', t.finance_invoice.uom],
                    ['140px', `${t.finance_invoice.unit_price}${selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}`],
                    ['120px', t.finance_invoice.subtotal],
                    ['70px',  t.finance_invoice.vat_percent],
                    ['110px', t.finance_invoice.vat_amt],
                    ['130px', t.finance_invoice.grand_total],
                  ] as [string, string][]).map(([w, label], i) => (
                    <Box key={i} w={w} flexShrink={0}>
                      <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{label}</Text>
                    </Box>
                  ))}
                </Flex>

                {items.map((item, idx) => (
                  <Flex key={item.id} minW="1100px" gap={3} mb={3} align="center" px={1}>
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
                    <Box w="140px" flexShrink={0}>
                      <Input value={fmt(parseFloat(item.unitPrice) || 0)} readOnly bg="gray.50" />
                    </Box>
                    <Box w="120px" flexShrink={0}>
                      <Input value={fmt(parseFloat(item.total) || 0)} readOnly bg="gray.50" />
                    </Box>
                    <Box w="70px" flexShrink={0}>
                      <Input value={item.vatPercent} readOnly bg="gray.50" />
                    </Box>
                    <Box w="110px" flexShrink={0}>
                      <Input value={fmt(parseFloat(item.vatAmount) || 0)} readOnly bg="gray.50" />
                    </Box>
                    <Box w="130px" flexShrink={0}>
                      <Input value={fmt(parseFloat(item.grandTotal) || 0)} readOnly bg="gray.50" fontWeight="semibold" />
                    </Box>
                  </Flex>
                ))}

                <Separator mt={2} mb={4} />
                <Flex justify="flex-end" minW="1100px" pr={1}>
                  <Box w="380px">
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="sm" color="gray.600">
                        {t.finance_invoice.subtotal}{selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}
                      </Text>
                      <Text fontSize="sm" fontWeight="semibold">{fmt(totalSubtotal)}</Text>
                    </Flex>
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="sm" color="gray.600">{t.finance_invoice.total_vat}</Text>
                      <Text fontSize="sm" fontWeight="semibold">{fmt(totalVat)}</Text>
                    </Flex>
                    <Separator mb={2} />
                    <Flex justify="space-between">
                      <Text fontWeight="bold">
                        {t.finance_invoice.grand_total}{selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ''}
                      </Text>
                      <Text fontWeight="bold" color={BIZGEN_COLOR}>{fmt(totalGrand)}</Text>
                    </Flex>
                    {!isIDR && form.exchange_rate && (
                      <Flex justify="space-between" mt={1}>
                        <Text fontSize="xs" color="gray.500">{t.finance_invoice.grand_total_idr}</Text>
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
                <Heading size="md">{t.finance_invoice.payment_method}</Heading>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {t.finance_invoice.payment_method_desc}
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
                    {t.finance_invoice.full_payment}
                  </Button>
                  <Button
                    size="sm"
                    bg={paymentType === 'installment' ? BIZGEN_COLOR : undefined}
                    color={paymentType === 'installment' ? 'white' : BIZGEN_COLOR}
                    variant={paymentType === 'installment' ? 'solid' : 'outline'}
                    borderColor={BIZGEN_COLOR}
                    onClick={() => handlePaymentTypeChange('installment')}
                  >
                    {t.finance_invoice.installment}
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
                  <Text fontWeight="semibold" color={BIZGEN_COLOR}>{t.finance_invoice.full_payment}</Text>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {t.finance_invoice.full_payment_desc}
                  </Text>
                  {form.due_date && (
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      {t.finance_invoice.due_date_label} <strong>{new Date(form.due_date).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                    </Text>
                  )}
                </Box>
                <Box textAlign="right">
                  <Text fontSize="xs" color="gray.500">{t.finance_invoice.total_amount}</Text>
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
                      {t.finance_invoice.add_installment}
                    </Button>
                  )}
                </Flex>

                {installments.length === 0 ? (
                  <Text fontSize="sm" color="gray.400" fontStyle="italic">
                    {t.finance_invoice.no_installments}
                  </Text>
                ) : (
                  <>
                    <Box overflowX="auto">
                      <Flex minW="1080px" gap={3} mb={2} px={1}>
                        {([
                          ['32px',  '#'],
                          ['100px', t.finance_invoice.installment_status],
                          ['160px', t.finance_invoice.installment_due_date],
                          ['180px', `${t.finance_invoice.installment_amount} (${selectedCurrencyCode || 'CCY'})`],
                          ['80px',  t.finance_invoice.mark_paid],
                          ['160px', t.finance_invoice.paid_date],
                          ['220px', t.finance_invoice.term_description],
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
                          minW="1080px"
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
                              {inst.isPaid ? t.finance_invoice.paid : t.finance_invoice.scheduled}
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
                              type="text"
                              placeholder="0.00"
                              value={focusedInstallmentId === inst.id ? inst.amount : fmt(parseFloat(inst.amount) || 0)}
                              onFocus={() => setFocusedInstallmentId(inst.id)}
                              onBlur={() => setFocusedInstallmentId(null)}
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
                          <Box w="220px" flexShrink={0}>
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
                      <Box w="380px">
                        <Flex justify="space-between" mb={1}>
                          <Text fontSize="sm" color="gray.600">{t.finance_invoice.invoice_grand_total}</Text>
                          <Text fontSize="sm" fontWeight="semibold">{fmt(totalGrand)}</Text>
                        </Flex>
                        <Flex justify="space-between" mb={1}>
                          <Text fontSize="sm" color="gray.600">{t.finance_invoice.total_scheduled}</Text>
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color={Math.abs(totalScheduled - totalGrand) > 0.01 ? 'red.500' : 'inherit'}
                          >
                            {fmt(totalScheduled)}
                            {Math.abs(totalScheduled - totalGrand) > 0.01 && (
                              <Text as="span" fontSize="xs" ml={1}>({t.finance_invoice.must_match_grand_total})</Text>
                            )}
                          </Text>
                        </Flex>
                        <Flex justify="space-between" mb={1}>
                          <Text fontSize="sm" color="green.600">{t.finance_invoice.total_received}</Text>
                          <Text fontSize="sm" fontWeight="semibold" color="green.600">{fmt(totalPaid)}</Text>
                        </Flex>
                        <Separator mb={2} />
                        <Flex justify="space-between">
                          <Text fontWeight="bold" color={outstanding > 0 ? BIZGEN_COLOR : 'green.600'}>
                            {t.finance_invoice.outstanding_balance}
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

        {/* ── Payment Info ─────────────────────────────────────────────────── */}
        <Card.Root>
          <Card.Header>
            <Flex flexDir="column">
              <Heading size="md">{t.finance_invoice.payment_information}</Heading>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {t.finance_invoice.payment_info_desc}
              </Text>
            </Flex>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>

              <Field.Root>
                <Field.Label fontSize="sm">{t.finance_invoice.receiving_bank}</Field.Label>
                <Select.Root
                  collection={bankAccountCollection}
                  value={bankAccountSelected ? [bankAccountSelected] : []}
                  onValueChange={(d) => setBankAccountSelected(d.value[0])}
                  disabled={isReadOnly}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select bank account" />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {bankAccountCollection.items.map((b) => (
                          <Select.Item item={b} key={b.value}>{b.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{t.finance_invoice.payment_method}</Field.Label>
                <Select.Root
                  collection={paymentMethodCollection}
                  value={paymentMethodSelected ? [paymentMethodSelected] : []}
                  onValueChange={(d) => setPaymentMethodSelected(d.value[0])}
                  disabled={isReadOnly}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select payment method" />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {paymentMethodCollection.items.map((p) => (
                          <Select.Item item={p} key={p.value}>{p.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{t.finance_invoice.cheque_no}</Field.Label>
                <Input
                  value={form.cheque_number}
                  onChange={(e) => setForm({ ...form, cheque_number: e.target.value })}
                  placeholder="Insert Cheque Number"
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{t.finance_invoice.cheque_date}</Field.Label>
                <Input
                  type="date"
                  value={form.cheque_date}
                  onChange={(e) => setForm({ ...form, cheque_date: e.target.value })}
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{t.finance_invoice.cheque_amount}</Field.Label>
                <Input
                  type="number"
                  value={form.cheque_amount}
                  onChange={(e) => setForm({ ...form, cheque_amount: e.target.value })}
                  placeholder="Insert cheque amount"
                  readOnly={isReadOnly}
                />
              </Field.Root>

            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* ── Shipping & Logistics ─────────────────────────────────────────── */}
        <Card.Root>
          <Card.Header>
            <Flex flexDir="column">
              <Heading size="md">{t.finance_invoice.shipping_logistics}</Heading>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {t.finance_invoice.shipping_logistics_desc}
              </Text>
            </Flex>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>

              <Field.Root>
                <Field.Label fontSize="sm">{t.finance_invoice.port_loading}</Field.Label>
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
                <Field.Label fontSize="sm">{t.finance_invoice.port_discharge}</Field.Label>
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
                <Field.Label fontSize="sm">{t.finance_invoice.vessel_flight_no}</Field.Label>
                <Input
                  value={form.vessel_flight}
                  onChange={(e) => setForm({ ...form, vessel_flight: e.target.value })}
                  placeholder="e.g. MV ORIENT STAR / GA 840"
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{t.finance_invoice.bl_awb_number}</Field.Label>
                <Input
                  value={form.bl_awb_number}
                  onChange={(e) => setForm({ ...form, bl_awb_number: e.target.value })}
                  placeholder="Bill of Lading / Air Waybill number"
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{t.finance_invoice.etd}</Field.Label>
                <Input
                  type="date"
                  value={form.etd}
                  onChange={(e) => setForm({ ...form, etd: e.target.value })}
                  readOnly={isReadOnly}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">{t.finance_invoice.eta}</Field.Label>
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
                <Heading size="md">{t.finance_invoice.supporting_documents}</Heading>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {t.finance_invoice.supporting_documents_desc}
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
                <Text fontSize="sm" color="gray.500">{t.finance_invoice.drag_drop_upload}</Text>
                <Button size="sm" variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} pointerEvents="none">
                  {t.finance_invoice.choose_files}
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
              <Heading size="md">{t.finance_invoice.history}</Heading>
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
