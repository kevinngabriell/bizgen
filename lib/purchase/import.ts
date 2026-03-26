export interface GetPurchaseImportNumber {
  number: string;
}

export interface CreatePurchaseImportItem {
  description: string;
  qty: string;
  uom_id: string;
  package_size: string;
  unit_price: string;
  total: string;
  remarks: string;
}

export interface CreatePurchaseImportData {
  po_number: string;
  po_date: string;
  supplier_id: string;
  shipment_period_id: string;
  term_id: string;
  payment_method_id: string;
  origin_id: string;
  currency_id: string;
  notes: string;
  should_mention: string;
  shipping_marks: string;
  remarks: string;
  status: 'draft' | 'submitted';
  items: CreatePurchaseImportItem[];
  documents: string[];
}

export async function generatePurchaseImportNumber(): Promise<GetPurchaseImportNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/generate-number.php?module_name=import`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase import number');
  }

  return json.data;
}

export async function createPurchaseImport(input: CreatePurchaseImportData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/import.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 201 && json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to create purchase import order');
  }

  return json;
}