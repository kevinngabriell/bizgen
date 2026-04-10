export interface GetPurchaseGoodsReceiptNumber {
  number: string;
}

export interface GetGoodsReceiptData {
  receipt_id: string;
  receipt_number: string;
  receipt_date: string;
  status: string;
  total_cost_idr: string;
  supplier_name: string;
  warehouse_name: string;
  created_at: string;
}

export interface GetGoodsReceiptDetailData {
  header: GetGoodsReceiptHeaderDetailData;
  items: GetGoodsReceiptItemDetailData[];
  history: GetGoodsReceiptHistoryDetailData[];
}

export interface GetGoodsReceiptHeaderDetailData {
  receipt_id: string;
  receipt_number: string;
  receipt_date: string;
  purchase_id_import: string | null;
  purchase_id_local: string | null;
  status: string;
  total_cost_idr: string;
  supplier_name: string;
  warehouse_name: string;
  ship_via_name: string;
  send_date: string | null;
  send_address: string | null;
  remarks: string | null;
}

export interface GetGoodsReceiptItemDetailData {
  receipt_item_id: string;
  receipt_id: string;
  item_id: string;
  qty_received: string;
  unit_cost: string;
  line_total: string;
  tax_amount: string | null;
  tax_rate: string | null;
  notes: string | null;
  item_name: string;
  uom_name: string;
  packaging_size: string | null;
}

export interface GetGoodsReceiptHistoryDetailData {
  pgr_log_id: string;
  receipt_id: string;
  action: string;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateGoodsReceiptItem {
  item_id: string;
  qty_received: number;
  unit_cost: number;
  uom_id?: string;
  packaging_size?: string;
  tax_amount?: number;
  notes?: string;
}

export interface CreateGoodsReceiptData {
  receipt_number: string;
  receipt_date: string;
  purchase_id_local?: string;
  purchase_id_import?: string;
  supplier_id?: string;
  warehouse_id?: string;
  send_date?: string;
  ship_via_id?: string;
  send_address?: string;
  remarks?: string;
  total_cost_idr?: number;
  items: CreateGoodsReceiptItem[];
}

export interface UpdateGoodsReceiptData {
  receipt_id: string;
  receipt_date?: string;
  send_date?: string;
  supplier_id?: string;
  warehouse_id?: string;
  ship_via_id?: string;
  send_address?: string;
  remarks?: string;
  total_cost_idr?: number;
  purchase_id_import?: string;
  purchase_id_local?: string;
  items?: CreateGoodsReceiptItem[];
}

export interface ProcessGoodsReceiptActionData {
  receipt_id: string;
  action: 'approve' | 'reject';
  notes?: string;
}

export async function generatePurchaseGoodsReceiptNumber(): Promise<GetPurchaseGoodsReceiptNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/generate-number.php?module_name=goods_receipt`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase goods receipt number');
  }

  return json.data;
}

export async function createGoodsReceipt(input: CreateGoodsReceiptData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/receiving.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 201 && json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to create goods receipt');
  }

  return json;
}

export async function getGoodsReceipt(page: number = 1, limit: number = 10, search: string = ''): Promise<{ data: GetGoodsReceiptData[]; pagination: any }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/receiving.php?page=${page}&limit=${limit}&params=${search}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch goods receipt');
  }

  return {
    data: json.data?.data || [],
    pagination: json.data?.pagination || {},
  };
}

export async function getGoodsReceiptDetail(id: string): Promise<GetGoodsReceiptDetailData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/receiving.php?id=${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch goods receipt detail');
  }

  return json.data;
}

export async function updateGoodsReceipt(input: UpdateGoodsReceiptData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/receiving.php`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to update goods receipt');
  }

  return json;
}

export async function processGoodsReceiptAction(input: ProcessGoodsReceiptActionData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/receiving.php?action=${input.action}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receipt_id: input.receipt_id,
      notes: input.notes,
    }),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to process goods receipt action');
  }

  return json;
}

export async function deleteGoodsReceipt(id: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/receiving.php?id=${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to delete goods receipt');
  }

  return json;
}
