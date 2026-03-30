export interface GetPurchaseImportNumber {
  number: string;
}

export interface CreatePurchaseImportItem {
  item_id: string;
  qty: string;
  unit_price: string;
  uom_id: string;
  packaging_size: string;
  description: string;
  notes: string;
}

export interface CreatePurchaseImportData {
  purchase_type: 'import';
  po_number: string;
  po_date: string;
  supplier_id: string;
  shipment_period_id: string;
  term_id: string;
  payment_method_id: string;
  origin_id: string;
  destination_id: string;
  currency_id: string;
  exchange_rate_to_idr: string;
  notes: string;
  items: CreatePurchaseImportItem[];
}

export interface GetPurchaseImportData {
  purchase_import_id: string;
  po_number: string;
  po_date: string;
  created_at: string;
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

  const res = await fetch(`${baseUrl}purchase/purchase-orders.php`, {
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

export async function getPurchaseImport(page: number = 1, limit: number = 10): Promise<{ data: GetPurchaseImportData[]; pagination: any }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/purchase-orders.php?type=import&page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase import orders');
  }

  return {
    data: json.data?.data || [],
    pagination: json.data?.pagination || {},
  };
}
