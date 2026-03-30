export interface GetPurchaseLocalNumber {
  number: string;
}

export interface CreatePurchaseLocalItem {
  item_id: string;
  qty: string;
  unit_price: string;
  uom_id: string;
  remarks: string;
}

export interface CreatePurchaseLocalData {
  purchase_type: 'local';
  po_number: string;
  po_date: string;
  delivery_date: string;
  supplier_id: string;
  payment_id: string;
  currency_id: string;
  tax_id: string;
  exchange_rate_idr: string;
  notes: string;
  items: CreatePurchaseLocalItem[];
}

export interface GetPurchaseLocalData {
  purchase_id: string;
  po_number: string;
  po_date: string;
  created_at: string;
}

export async function generatePurchaseLocalNumber(): Promise<GetPurchaseLocalNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/generate-number.php?module_name=local`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase local number');
  }

  return json.data;
}

export async function createPurchaseLocal(input: CreatePurchaseLocalData): Promise<any> {
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
    throw new Error(json.status_message || 'Failed to create purchase local order');
  }

  return json;
}

export async function getPurchaseLocal(page: number = 1, limit: number = 10): Promise<{ data: GetPurchaseLocalData[]; pagination: any }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/purchase-orders.php?type=local&page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase local orders');
  }

  return {
    data: json.data?.data || [],
    pagination: json.data?.pagination || {},
  };
}
