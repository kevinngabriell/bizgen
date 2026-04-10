export interface GetPurchaseRequisitionNumber {
  number: string;
}

export interface GetPurchaseRequisitionData {
  pr_id: string;
  pr_number: string;
  pr_date: string;
  priority: string;
  status: string;
  supplier_name: string;
  created_at: string;
}

export interface GetPurchaseRequisitionDetailData {
  header: GetPurchaseRequisitionHeaderDetailData;
  items: GetPurchaseRequisitionItemDetailData[];
  history: GetPurchaseRequisitionHistoryDetailData[];
}

export interface GetPurchaseRequisitionHeaderDetailData {
  pr_id: string;
  pr_number: string;
  pr_date: string;
  requester_name: string;
  department: string;
  priority: string;
  category: string;
  deadline_date: string;
  status: string;
  supplier_name: string;
  currency_code: string;
}

export interface GetPurchaseRequisitionItemDetailData {
  pr_item_id: string;
  pr_id: string;
  item_id: string;
  quantity: string;
  uom_id: string;
  estimated_price: string;
  remarks: string | null;
  item_name: string;
  uom_name: string;
}

export interface GetPurchaseRequisitionHistoryDetailData {
  pr_log_id: string;
  pr_id: string;
  action: string;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface CreatePurchaseRequisitionItem {
  item_id: string;
  quantity: number;
  uom_id?: string;
  estimated_price?: number;
  remarks?: string;
}

export interface CreatePurchaseRequisitionData {
  pr_number: string;
  pr_date: string;
  priority: 'normal' | 'urgent' | 'critical';
  supplier_id: string;
  currency_id: string;
  requester_name?: string;
  department?: string;
  category?: 'operational_supplies' | 'office_supplies' | 'it_equipment' | 'logistics_equipment' | 'services' | 'other';
  deadline_date?: string;
  notes?: string;
  items: CreatePurchaseRequisitionItem[];
}

export interface UpdatePurchaseRequisitionData {
  pr_id: string;
  pr_date?: string;
  requester_name?: string;
  department?: string;
  priority?: 'normal' | 'urgent' | 'critical';
  category?: 'operational_supplies' | 'office_supplies' | 'it_equipment' | 'logistics_equipment' | 'services' | 'other';
  deadline_date?: string;
  supplier_id?: string;
  currency_id?: string;
  notes?: string;
  items?: CreatePurchaseRequisitionItem[];
}

export interface ProcessPurchaseRequisitionActionData {
  pr_id: string;
  action: 'submit' | 'approve' | 'reject';
  notes?: string;
}

export async function generatePurchaseRequisitionNumber(): Promise<GetPurchaseRequisitionNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

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
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/requisitions.php`, {
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

export async function getPurchaseRequisition(page: number = 1, limit: number = 10, search: string = ''): Promise<{ data: GetPurchaseRequisitionData[]; pagination: any }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/requisitions.php?page=${page}&limit=${limit}&params=${search}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase requisitions');
  }

  return {
    data: json.data?.data || [],
    pagination: json.data?.pagination || {},
  };
}

export async function getPurchaseRequisitionDetail(id: string): Promise<GetPurchaseRequisitionDetailData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/requisitions.php?id=${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase requisition detail');
  }

  return json.data;
}

export async function updatePurchaseRequisition(input: UpdatePurchaseRequisitionData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/requisitions.php`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to update purchase requisition');
  }

  return json;
}

export async function processPurchaseRequisitionAction(input: ProcessPurchaseRequisitionActionData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/requisitions.php?action=${input.action}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pr_id: input.pr_id,
      notes: input.notes,
    }),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to process purchase requisition action');
  }

  return json;
}

export async function deletePurchaseRequisition(id: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}purchase/requisitions.php?id=${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to delete purchase requisition');
  }

  return json;
}
