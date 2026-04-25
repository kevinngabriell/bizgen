export interface GetPurchaseLocalNumber {
  number: string;
}

export interface GetPurchaseLocalData {
  purchase_id: string;
  po_number: string;
  po_date: string;
  delivery_date: string;
  status: string;
  supplier_name: string;
  created_at: string;
}

export interface GetPurchaseLocalDetailData {
  header: GetPurchaseLocalHeaderDetailData;
  items: GetPurchaseLocalItemDetailData[];
  history: GetPurchaseLocalHistoryDetailData[];
}

export interface GetPurchaseLocalHeaderDetailData {
  purchase_id: string;
  po_number: string;
  po_date: string;
  delivery_date: string;
  status: string;
  supplier_id?: string;
  supplier_name: string;
  currency_code: string;
  payment_id: string | null;
  payment_name: string | null;
  tax_name: string | null;
  exchange_rate_idr: string | null;
  notes: string | null;
  delivery_address: string | null;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

export interface GetPurchaseLocalItemDetailData {
  item_id: string;
  qty: string;
  unit_price: string;
  line_total: string;
  remarks: string | null;
  item_name: string;
  uom_name: string;
}

export interface GetPurchaseLocalHistoryDetailData {
  action: string;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface CreatePurchaseLocalItem {
  item_id: string;
  qty: number;
  unit_price: number;
  uom_id?: string;
  remarks?: string;
}

export interface CreatePurchaseLocalData {
  purchase_type: 'local';
  po_number: string;
  po_date: string;
  delivery_date: string;
  supplier_id: string;
  payment_id: string;
  currency_id?: string;
  tax_id?: string;
  exchange_rate_idr?: number;
  notes?: string;
  delivery_address?: string;
  items: CreatePurchaseLocalItem[];
}

export interface UpdatePurchaseLocalData {
  purchase_id: string;
  po_date?: string;
  delivery_date?: string;
  supplier_id?: string;
  payment_id?: string;
  currency_id?: string;
  tax_id?: string;
  exchange_rate_idr?: number;
  notes?: string;
  delivery_address?: string;
  items?: CreatePurchaseLocalItem[];
}

export interface ProcessPurchaseLocalActionData {
  purchase_id: string;
  action: 'submit' | 'approve' | 'reject';
  notes?: string;
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
    pagination: { page: json.data?.page, limit: json.data?.limit, total: json.data?.total },
  };
}

export async function getPurchaseLocalDetail(id: string): Promise<GetPurchaseLocalDetailData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/purchase-orders.php?id=${id}&type=local`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase local order detail');
  }

  return json.data;
}

export async function updatePurchaseLocal(input: UpdatePurchaseLocalData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/purchase-orders.php?type=local`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to update purchase local order');
  }

  return json;
}

export async function processPurchaseLocalAction(input: ProcessPurchaseLocalActionData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/purchase-orders.php?type=local&action=${input.action}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      purchase_id: input.purchase_id,
      notes: input.notes,
    }),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to process purchase local order action');
  }

  return json;
}

export async function deletePurchaseLocal(id: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/purchase-orders.php?type=local&id=${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to delete purchase local order');
  }

  return json;
}
