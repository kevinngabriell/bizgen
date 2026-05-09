export interface GetInvoiceNumber {
  number: string;
}

export interface InvoiceListItem {
  invoice_id: string;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  status: string;
  customer_name: string;
  total_amount: number;
  total_amount_idr: number;
  payment_type: 'full' | 'installment';
  currency_code: string;
  created_at?: string;
}

export interface InvoiceHeaderDetail {
  invoice_id: string;
  invoice_no: string;
  form_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  customer_id: string;
  customer_name: string;
  sales_order_id: string;
  sales_order_no: string;
  currency_id: string;
  currency_code: string;
  exchange_rate: number;
  term_id: string;
  term_name: string;
  bank_name: string;
  bank_number: string;
  payment_name: string;
  payment_type: 'full' | 'installment';
  bank_account_id: string;
  payment_method_id: string;
  cheque_number?: string;
  cheque_date?: string;
  cheque_amount?: number;
  origin_port_id?: string;
  origin_port_name?: string;
  destination_port_id?: string;
  destination_port_name?: string;
  vessel_flight?: string;
  bl_awb_number?: string;
  etd?: string;
  eta?: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  total_amount_idr: number;
  notes?: string;
}

export interface InvoiceItemDetail {
  invoice_item_id: string;
  item_ref_id: string;
  description: string;
  quantity: number;
  uom_name: string;
  unit_price: number;
  line_subtotal: number;
  tax_percent: number;
  tax_amount: number;
  line_total: number;
  sort_order: number;
}

export interface InvoiceInstallmentDetail {
  installment_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  is_paid: number;
  paid_date: string | null;
  notes?: string;
}

export interface InvoiceHistoryDetail {
  log_id: string;
  action: string;
  old_status: string | null;
  new_status: string;
  description: string;
  created_by: string;
  created_at: string;
}

export interface GetInvoiceDetailResponse {
  header: InvoiceHeaderDetail;
  items: InvoiceItemDetail[];
  installments: InvoiceInstallmentDetail[];
  history: InvoiceHistoryDetail[];
}

export interface CreateInvoiceItemData {
  item_ref_id?: string;
  description: string;
  quantity: number;
  uom_name: string;
  unit_price: number;
  line_subtotal: number;
  tax_percent: number;
  tax_amount: number;
  line_total: number;
  sort_order?: number;
}

export interface CreateInvoiceInstallmentData {
  installment_number: number;
  due_date: string;
  amount: number;
  notes?: string;
}

export interface CreateInvoiceData {
  invoice_no: string;
  form_number?: string;
  invoice_date: string;
  due_date?: string;
  customer_id: string;
  sales_order_id?: string;
  currency_id: string;
  exchange_rate?: number;
  term_id?: string;
  payment_type?: 'full' | 'installment';
  bank_account_id?: string;
  payment_method_id?: string;
  cheque_number?: string;
  cheque_date?: string;
  cheque_amount?: number;
  origin_port_id?: string;
  destination_port_id?: string;
  vessel_flight?: string;
  bl_awb_number?: string;
  etd?: string;
  eta?: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  total_amount_idr: number;
  notes?: string;
  items: CreateInvoiceItemData[];
  installments?: CreateInvoiceInstallmentData[];
}

export interface UpdateInvoiceData {
  invoice_id: string;
  invoice_date?: string;
  due_date?: string;
  form_number?: string;
  term_id?: string;
  payment_type?: 'full' | 'installment';
  bank_account_id?: string;
  payment_method_id?: string;
  cheque_number?: string;
  cheque_date?: string;
  cheque_amount?: number;
  origin_port_id?: string;
  destination_port_id?: string;
  vessel_flight?: string;
  bl_awb_number?: string;
  etd?: string;
  eta?: string;
  subtotal_amount?: number;
  tax_amount?: number;
  total_amount?: number;
  total_amount_idr?: number;
  notes?: string;
  exchange_rate?: number;
  items?: CreateInvoiceItemData[];
  installments?: CreateInvoiceInstallmentData[];
}

export interface MarkInvoiceInstallmentPaidData {
  installment_id: string;
  is_paid: boolean;
  paid_date?: string;
}

export async function generateInvoiceNumber(): Promise<GetInvoiceNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/generate-number.php?module_name=finance_invoice`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to generate invoice number');
  }

  return json.data;
}

export async function getInvoices(
  page: number = 1,
  limit: number = 10,
  search: string = ''
): Promise<{ data: InvoiceListItem[]; pagination: any }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(
    `${baseUrl}finance/invoice.php?page=${page}&limit=${limit}&params=${search}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to fetch invoices');
  }

  return {
    data: json.data?.data || [],
    pagination: json.data?.pagination || {},
  };
}

export async function getInvoiceDetail(invoice_id: string): Promise<GetInvoiceDetailResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/invoice.php?invoice_id=${invoice_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to fetch invoice detail');
  }

  return json.data;
}

export async function createInvoice(input: CreateInvoiceData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/invoice.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 201 && (json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to create invoice');
  }

  return json;
}

export async function updateInvoice(input: UpdateInvoiceData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/invoice.php`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to update invoice');
  }

  return json;
}

export async function submitInvoice(invoice_id: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/invoice.php?action=submit`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ invoice_id }),
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to submit invoice');
  }

  return json;
}

export async function approveInvoice(invoice_id: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/invoice.php?action=approve`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ invoice_id }),
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to approve invoice');
  }

  return json;
}

export async function rejectInvoice(invoice_id: string, notes?: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/invoice.php?action=reject`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ invoice_id, notes }),
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to reject invoice');
  }

  return json;
}

export async function markInvoiceInstallmentPaid(
  input: MarkInvoiceInstallmentPaidData
): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/invoice.php?action=pay_installment`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to mark installment as paid');
  }

  return json;
}

export async function deleteInvoice(invoice_id: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/invoice.php?invoice_id=${invoice_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to delete invoice');
  }

  return json;
}
