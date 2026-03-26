export interface GetPurchaseRequisitionNumber {
  number: string;
}

export interface CreatePurchaseRequisitionItem {
  item_id: string;
  quantity: string;
  uom_id: string;
  estimated_price: string;
  remarks: string;
}

export interface CreatePurchaseRequisitionData {
  pr_number: string;
  pr_date: string;
  requester_name: string;
  department: string;
  priority: string;
  category: string;
  deadline_date: string;
  supplier_id: string;
  currency_id: string;
  notes: string;
  status: "draft" | "submitted";
  items: CreatePurchaseRequisitionItem[];
}

export async function generatePurchaseRequisitionNumber(): Promise<GetPurchaseRequisitionNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}purchase/generate-number.php?module_name=requisition`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase requisition number');
  }

  return json.data;
}

export async function createPurchaseRequisition(input: CreatePurchaseRequisitionData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}purchase/requisition.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 201 && json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to create purchase requisition');
  }

  return json;
}
