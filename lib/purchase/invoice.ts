export interface GetPurchaseInvoiceNumber {
  number: string;
}

export interface CreatePurchaseInvoiceItem {
  item_id: string;
  uom_id: string;
  quantity: string;
  unit_price: string;
  tax_percent: string;
  notes: string;
}

export interface CreatePurchaseInvoiceData {
  invoice_number: string;
  supplier_id: string;
  invoice_date: string;
  purchase_order_local_id: string;
  purchase_order_import_id: string;
  due_date: string;
  term_id: string;
  currency_id: string;
  exchange_rate_to_idr: string;
  notes: string;
  items: CreatePurchaseInvoiceItem[];
}

export interface GetPurchaseInvoiceData {
  purchase_invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  created_at: string;
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
