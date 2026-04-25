export interface GetPurchaseImportNumber {
  number: string;
}

export interface GetPurchaseImportData {
  purchase_id: string;
  po_number: string;
  po_date: string;
  status: string;
  currency_id?: string;
  supplier_name: string;
  created_at: string;
}

export interface GetPurchaseImportDetailData {
  header: GetPurchaseImportHeaderDetailData;
  items: GetPurchaseImportItemDetailData[];
  history: GetPurchaseImportHistoryDetailData[];
}

export interface GetPurchaseImportHeaderDetailData {
  purchase_import_id: string;
  po_number: string;
  po_date: string;
  status: string;
  supplier_id?: string;
  supplier_name: string;
  currency_code: string;
  shipment_period_name: string;
  term_name: string;
  payment_method_name: string;
  origin_name: string;
  destination_name: string;
  exchange_rate_to_idr: string | null;
}

export interface GetPurchaseImportItemDetailData {
  purchase_import_item_id: string;
  item_id: string;
  qty: string;
  unit_price: string;
  line_total: string;
  packaging_size: string | null;
  description: string | null;
  item_name: string;
  uom_name: string;
}

export interface GetPurchaseImportHistoryDetailData {
  pi_log_id: string;
  purchase_import_id: string;
  action: string;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface CreatePurchaseImportItem {
  item_id: string;
  qty: number;
  unit_price: number;
  uom_id?: string;
  packaging_size?: string;
  description?: string;
  notes?: string;
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
  exchange_rate_to_idr: number;
  notes?: string;
  items: CreatePurchaseImportItem[];
}

export interface UpdatePurchaseImportData {
  purchase_import_id: string;
  po_date?: string;
  supplier_id?: string;
  shipment_period_id?: string;
  term_id?: string;
  payment_method_id?: string;
  origin_id?: string;
  destination_id?: string;
  currency_id?: string;
  exchange_rate_to_idr?: number;
  notes?: string;
  items?: CreatePurchaseImportItem[];
}

export interface ProcessPurchaseImportActionData {
  purchase_import_id: string;
  action: 'submit' | 'approve' | 'reject';
  notes?: string;
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
    pagination: { page: json.data?.page, limit: json.data?.limit, total: json.data?.total },
  };
}

export async function getPurchaseImportDetail(id: string): Promise<GetPurchaseImportDetailData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/purchase-orders.php?id=${id}&type=import`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase import order detail');
  }

  return json.data;
}

export async function updatePurchaseImport(input: UpdatePurchaseImportData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/purchase-orders.php?type=import`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to update purchase import order');
  }

  return json;
}

export async function processPurchaseImportAction(input: ProcessPurchaseImportActionData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/purchase-orders.php?type=import&action=${input.action}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      purchase_import_id: input.purchase_import_id,
      notes: input.notes,
    }),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to process purchase import order action');
  }

  return json;
}

export async function deletePurchaseImport(id: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/purchase-orders.php?type=import&id=${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to delete purchase import order');
  }

  return json;
}
