export interface GetPurchaseGoodsReceiptNumber {
  number: string;
}

export interface CreateGoodsReceiptItem {
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

export interface CreateGoodsReceiptData {
  gr_number: string;
  supplier_id: string;
  po_number: string;
  receiving_date: string;
  address: string;
  ship_date: string;
  ship_via_id: string;
  notes: string;
  status: 'draft' | 'posted';
  items: CreateGoodsReceiptItem[];
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

  const res = await fetch(`${baseUrl}purchase/goods-receipt.php`, {
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