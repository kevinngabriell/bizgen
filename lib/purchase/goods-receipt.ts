export interface GetPurchaseGoodsReceiptNumber {
  number: string;
}

export interface CreateGoodsReceiptItem {
  item_id: string;
  qty_received: string;
  unit_cost: string;
  uom_id: string;
  packaging_size: string;
  tax_amount: string;
  notes: string;
}

export interface CreateGoodsReceiptData {
  receipt_number: string;
  receipt_date: string;
  purchase_id_local: string;
  purchase_id_import: string;
  supplier_id: string;
  warehouse_id: string;
  send_date: string;
  ship_via_id: string;
  send_address: string;
  remarks: string;
  total_cost_idr: string;
  items: CreateGoodsReceiptItem[];
}

export interface GetGoodsReceiptData {
  receipt_id: string;
  receipt_number: string;
  receipt_date: string;
  created_at: string;
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
