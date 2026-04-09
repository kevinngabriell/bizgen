export interface GetPurchaseQuotationNumber {
    number: string;
}

export interface GetPurchaseQuotationData {
  purchase_quotation_id: string;
  purchase_quotation_number: string;
  shipment_type: string;
  quotation_status: string;
  created_at: string;
  vendor_name: string;
}

export interface GetPurchaseQuotationDetailData {
  header: GetPurchaseQuotationHeaderDetailData;
  items: GetPurchaseQuotationItemDetailData[];
  history: GetPurchaseQuotationHistoryDetailData[];
}

export interface GetPurchaseQuotationHeaderDetailData {
  purchase_quotation_id: string;
  purchase_quotation_number: string;
  vendor_id: string;
  customer_id: string;
  shipment_type: string;
  ship_via_id: string;
  origin_id: string;
  destination_id: string;
  sales_rfq_id: string;
  remarks: string;
  quotation_status: string;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GetPurchaseQuotationItemDetailData {
  purchase_quotation_item_id: string;
  purchase_quotation_id: string;
  item_name: string;
  hs_code: string;
  quantity: string;
  uom_id: string;
  unit_price: string;
  currency_id: string;
  uom_name: string;
  currency_code: string;
}

export interface GetPurchaseQuotationHistoryDetailData {
  purchase_quotation_log_id: string;
  purchase_quotation_id: string;
  action: string;
  action_by: string;
  action_at: string;
}

export interface CreatePurchaseQuotation {
  vendor_id: string;
  customer_id: string;
  shipment_type: string;
  ship_via_id: string;
  origin_id: string;
  destination_id: string;
  sales_rfq_id: string;
  remarks: string;
  items: CreatePurchaseQuotationItem[];
}

export interface CreatePurchaseQuotationItem {
  item_name: string;
  quantity: number;
  uom_id: string;
  unit_price: number;
  currency_id: string;
  hs_code: string;
}

export interface UpdatePurchaseQuotationData {
  purchase_quotation_id: string;
  vendor_id?: string;
  customer_id?: string;
  shipment_type?: string;
  ship_via_id?: string;
  origin_id?: string;
  destination_id?: string;
  sales_rfq_id?: string;
  remarks?: string;
  items?: CreatePurchaseQuotationItem[];
}

export interface ProcessPurchaseQuotationActionData {
  purchase_quotation_id: string;
  action: 'submit' | 'approve' | 'reject';
  notes?: string;
}

export async function generatePurchaseQuotationNumber(): Promise<GetPurchaseQuotationNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}purchase/generate-number.php?module_name=quotation`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase quotation number');
  }

  return json.data;
}

export async function createPurchaseQuotation(input: CreatePurchaseQuotation): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}purchase/quotations.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 201 && json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to create purchase quotation');
  }

  return json;
}

export async function getPurchaseQuotations(page: number = 1, limit: number = 10): Promise<{ data: GetPurchaseQuotationData[]; pagination: any }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}purchase/quotations.php?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase quotations');
  }

  return {
    data: json.data?.data || [],
    pagination: json.data?.pagination || {},
  };
}

export async function getPurchaseQuotationDetail(id: string): Promise<GetPurchaseQuotationDetailData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}purchase/quotations.php?id=${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase quotation detail');
  }

  return json.data;
}

export async function updatePurchaseQuotation(input: UpdatePurchaseQuotationData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}purchase/quotations.php`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to update purchase quotation');
  }

  return json;
}

export async function processPurchaseQuotationAction(input: ProcessPurchaseQuotationActionData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}purchase/quotations.php?action=${input.action}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      purchase_quotation_id: input.purchase_quotation_id,
      notes: input.notes,
    }),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to process purchase quotation action');
  }

  return json;
}

export async function deletePurchaseQuotation(id: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}purchase/quotations.php?id=${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to delete purchase quotation');
  }

  return json;
}
