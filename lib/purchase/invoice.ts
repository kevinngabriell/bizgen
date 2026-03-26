export interface GetPurchaseInvoiceNumber {
  number: string;
}

export interface CreatePurchaseInvoiceItem {
  item_id: string;
  description: string;
  qty: string;
  uom_id: string;
  package_size: string;
  unit_price: string;
  total: string;
  vat_percent: string;
  vat_amount: string;
  grand_total: string;
  remarks: string;
}

export interface CreatePurchaseInvoiceData {
  invoice_number: string;
  supplier_id: string;
  po_number: string;
  invoice_date: string;
  ship_date: string;
  exchange_rate: string;
  term_id: string;
  currency_id: string;
  notes: string;
  status: 'draft' | 'posted';
  items: CreatePurchaseInvoiceItem[];
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

  const res = await fetch(`${baseUrl}purchase/invoice.php`, {
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