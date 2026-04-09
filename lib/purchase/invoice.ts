export interface GetPurchaseInvoiceNumber {
  number: string;
}

export interface GetPurchaseInvoiceData {
  purchase_invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  total_amount: string;
  supplier_name: string;
}

export interface GetPurchaseInvoiceDetailData {
  header: GetPurchaseInvoiceHeaderDetailData;
  items: GetPurchaseInvoiceItemDetailData[];
  history: GetPurchaseInvoiceHistoryDetailData[];
}

export interface GetPurchaseInvoiceHeaderDetailData {
  purchase_invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  subtotal_amount: string;
  tax_amount: string;
  total_amount: string;
  exchange_rate_to_idr: string;
  supplier_name: string;
  currency_code: string;
  term_name: string;
  purchase_id_local: string | null;
  purchase_id_import: string | null;
  po_number: string | null;
  notes: string | null;
}

export interface GetPurchaseInvoiceItemDetailData {
  invoice_item_id: string;
  purchase_invoice_id: string;
  item_id: string;
  quantity: string;
  unit_price: string;
  tax_percent: string;
  tax_amount: string;
  line_total: string;
  item_name: string;
  uom_name: string;
  notes: string | null;
}

export interface GetPurchaseInvoiceHistoryDetailData {
  pi_log_id: string;
  purchase_invoice_id: string;
  action: string;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface CreatePurchaseInvoiceItem {
  item_id: string;
  quantity: number;
  unit_price: number;
  uom_id?: string;
  tax_percent?: number;
  notes?: string;
}

export interface CreatePurchaseInvoiceData {
  invoice_number: string;
  supplier_id: string;
  invoice_date: string;
  purchase_order_local_id?: string;
  purchase_order_import_id?: string;
  due_date?: string;
  term_id?: string;
  currency_id?: string;
  exchange_rate_to_idr?: number;
  notes?: string;
  items: CreatePurchaseInvoiceItem[];
}

export interface UpdatePurchaseInvoiceData {
  purchase_invoice_id: string;
  supplier_id?: string;
  purchase_order_local_id?: string;
  purchase_order_import_id?: string;
  invoice_date?: string;
  due_date?: string;
  term_id?: string;
  currency_id?: string;
  exchange_rate_to_idr?: number;
  notes?: string;
  items?: CreatePurchaseInvoiceItem[];
}

export interface ProcessPurchaseInvoiceActionData {
  purchase_invoice_id: string;
  action: 'approve' | 'reject';
  notes?: string;
}

export async function generatePurchaseInvoiceNumber(): Promise<GetPurchaseInvoiceNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/generate-number.php?module_name=invoice`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase invoice number');
  }

  return json.data;
}

export async function createPurchaseInvoice(input: CreatePurchaseInvoiceData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/invoices.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 201 && json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to create purchase invoice');
  }

  return json;
}

export async function getPurchaseInvoice(page: number = 1, limit: number = 10): Promise<{ data: GetPurchaseInvoiceData[]; pagination: any }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/invoices.php?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase invoices');
  }

  return {
    data: json.data?.data || [],
    pagination: json.data?.pagination || {},
  };
}

export async function getPurchaseInvoiceDetail(id: string): Promise<GetPurchaseInvoiceDetailData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/invoices.php?id=${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase invoice detail');
  }

  return json.data;
}

export async function updatePurchaseInvoice(input: UpdatePurchaseInvoiceData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/invoices.php`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to update purchase invoice');
  }

  return json;
}

export async function processPurchaseInvoiceAction(input: ProcessPurchaseInvoiceActionData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/invoices.php?action=${input.action}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      purchase_invoice_id: input.purchase_invoice_id,
      notes: input.notes,
    }),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to process purchase invoice action');
  }

  return json;
}

export async function deletePurchaseInvoice(id: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/invoices.php?id=${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to delete purchase invoice');
  }

  return json;
}
