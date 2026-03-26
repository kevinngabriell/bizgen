export interface GetPurchaseLocalNumber {
  number: string;
}

export interface CreatePurchaseLocalItem {
  description: string;
  qty: string;
  uom_id: string;
  package_size: string;
  unit_price: string;
  total: string;
  dpp: string;
  ppn: string;
  grand_total: string;
  remarks: string;
}

export interface CreatePurchaseLocalData {
  po_number: string;
  po_date: string;
  supplier_id: string;
  delivery_date: string;
  payment_id: string;
  tax_id: string;
  currency_id: string;
  delivery_address: string;
  notes: string;
  status: "draft" | "submitted";
  items: CreatePurchaseLocalItem[];
  documents: string[];
}

export async function generatePurchaseLocalNumber(): Promise<GetPurchaseLocalNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

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
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}purchase/local.php`, {
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
