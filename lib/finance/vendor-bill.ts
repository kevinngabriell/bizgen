export interface GetVendorBillNumber {
  number: string;
}

export interface SupplierData {
  supplier_id: string;
  supplier_name: string;
  origin_name: string;
  currency_name: string;
  term_name: string;
}

export interface PurchaseOrderListItem {
  purchase_id: string;
  po_number: string;
  po_date: string;
  status: string;
  supplier_name: string;
}

export interface LocalPOItemDetail {
  item_id: string;
  item_name: string;
  uom_name: string;
  qty: string;
  unit_price: string;
  line_total: string;
  remarks: string | null;
}

export interface LocalPODetail {
  header: {
    purchase_id: string;
    po_number: string;
    supplier_name: string;
    currency_code: string;
  };
  items: LocalPOItemDetail[];
  history: any[];
}

export interface ImportPOItemDetail {
  purchase_import_item_id: string;
  item_id: string;
  item_name: string;
  uom_name: string;
  qty: string;
  unit_price: string;
  line_total: string;
  packaging_size?: string;
  description?: string;
}

export interface ImportPODetail {
  header: {
    purchase_import_id: string;
    po_number: string;
    supplier_name: string;
    currency_code: string;
    exchange_rate_to_idr: string;
  };
  items: ImportPOItemDetail[];
  history: any[];
}

export interface VendorBillListItem {
  vendor_bill_id: string;
  bill_no: string;
  bill_date: string;
  due_date: string;
  bill_status: string;
  supplier_name: string;
  total_amount: number;
  total_amount_idr: number;
  payment_type: 'full' | 'installment';
  purchase_type: 'local' | 'import';
  currency_code: string;
}

export interface VendorBillHeaderDetail {
  vendor_bill_id: string;
  bill_no: string;
  bill_date: string;
  due_date: string;
  bill_status: string;
  vendor_id: string;
  supplier_name: string;
  purchase_id: string;
  purchase_type: 'local' | 'import';
  currency_id: string;
  currency_code: string;
  exchange_rate: number;
  term_id: string;
  term_name: string;
  payment_type: 'full' | 'installment';
  origin_port_id?: string;
  origin_port_name?: string;
  destination_port_id?: string;
  destination_port_name?: string;
  vessel_flight?: string | null;
  bl_awb_number?: string | null;
  etd?: string | null;
  eta?: string | null;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  total_amount_idr: number;
  notes?: string | null;
}

export interface VendorBillItemDetail {
  bill_item_id: string;
  item_ref_id: string;
  description: string;
  qty: string;
  uom_name: string;
  unit_price: string;
  line_subtotal: number;
  tax_percent: number;
  tax_amount: number;
  line_total: number;
  sort_order: number;
}

export interface VendorBillInstallmentDetail {
  installment_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  is_paid: number;
  paid_date: string | null;
  notes?: string;
}

export interface VendorBillHistoryDetail {
  log_id: string;
  action: string;
  old_status: string | null;
  new_status: string;
  description: string;
  created_by: string;
  created_at: string;
}

export interface GetVendorBillDetailResponse {
  header: VendorBillHeaderDetail;
  items: VendorBillItemDetail[];
  installments: VendorBillInstallmentDetail[];
  history: VendorBillHistoryDetail[];
}

export interface CreateVendorBillItemData {
  item_ref_id?: string;
  description: string;
  qty: number;
  uom_name: string;
  unit_price: number;
  line_subtotal: number;
  tax_percent: number;
  tax_amount: number;
  line_total: number;
  sort_order?: number;
}

export interface CreateVendorBillInstallmentData {
  installment_number: number;
  due_date: string;
  amount: number;
  notes?: string;
}

export interface CreateVendorBillData {
  bill_no: string;
  bill_date: string;
  due_date?: string;
  vendor_id: string;
  purchase_id?: string;
  purchase_type?: 'local' | 'import';
  currency_id: string;
  exchange_rate?: number;
  term_id?: string;
  payment_type?: 'full' | 'installment';
  origin_port_id?: string | null;
  destination_port_id?: string | null;
  vessel_flight?: string | null;
  bl_awb_number?: string | null;
  etd?: string | null;
  eta?: string | null;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  total_amount_idr: number;
  notes?: string | null;
  items: CreateVendorBillItemData[];
  installments?: CreateVendorBillInstallmentData[];
}

export interface UpdateVendorBillData {
  vendor_bill_id: string;
  bill_date?: string;
  due_date?: string;
  term_id?: string;
  payment_type?: 'full' | 'installment';
  exchange_rate?: number;
  origin_port_id?: string | null;
  destination_port_id?: string | null;
  vessel_flight?: string | null;
  bl_awb_number?: string | null;
  etd?: string | null;
  eta?: string | null;
  subtotal_amount?: number;
  tax_amount?: number;
  total_amount?: number;
  total_amount_idr?: number;
  notes?: string | null;
  items?: CreateVendorBillItemData[];
  installments?: CreateVendorBillInstallmentData[];
}

export interface MarkVendorBillInstallmentPaidData {
  installment_id: string;
  is_paid: boolean;
  paid_date?: string;
}

// ── Supplier & PO lookup functions ──────────────────────────────────────────

export async function getSuppliers(search: string = ''): Promise<{ data: SupplierData[] }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(
    `${baseUrl}master/supplier.php?page=1&limit=1000&params=${search}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to fetch suppliers');
  }

  return { data: json.data?.data || [] };
}

export async function getLocalPOsBySupplier(
  supplier_id: string
): Promise<{ data: PurchaseOrderListItem[] }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(
    `${baseUrl}purchase/purchase-orders.php?type=local&supplier_id=${supplier_id}&status=approved&page=1&limit=1000`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to fetch local purchase orders');
  }

  return { data: json.data?.data || [] };
}

export async function getImportPOsBySupplier(
  supplier_id: string
): Promise<{ data: PurchaseOrderListItem[] }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(
    `${baseUrl}purchase/purchase-orders.php?type=import&supplier_id=${supplier_id}&status=approved&page=1&limit=1000`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to fetch import purchase orders');
  }

  return { data: json.data?.data || [] };
}

export async function getLocalPODetail(purchase_id: string): Promise<LocalPODetail> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(
    `${baseUrl}purchase/purchase-orders.php?id=${purchase_id}&type=local`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to fetch local PO detail');
  }

  return json.data;
}

export async function getImportPODetail(purchase_id: string): Promise<ImportPODetail> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(
    `${baseUrl}purchase/purchase-orders.php?id=${purchase_id}&type=import`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to fetch import PO detail');
  }

  return json.data;
}

// ── Vendor bill functions ───────────────────────────────────────────────────

export async function generateVendorBillNumber(): Promise<GetVendorBillNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/generate-number.php?module_name=vendor_bill`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to generate vendor bill number');
  }

  return json.data;
}

export async function getVendorBills(
  page: number = 1,
  limit: number = 10,
  search: string = ''
): Promise<{ data: VendorBillListItem[]; pagination: any }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(
    `${baseUrl}finance/vendor-bill.php?page=${page}&limit=${limit}&params=${search}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to fetch vendor bills');
  }

  return {
    data: json.data?.data || [],
    pagination: json.data?.pagination || {},
  };
}

export async function getVendorBillDetail(bill_id: string): Promise<GetVendorBillDetailResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/vendor-bill.php?bill_id=${bill_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to fetch vendor bill detail');
  }

  return json.data;
}

export async function createVendorBill(input: CreateVendorBillData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/vendor-bill.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 201 && (json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to create vendor bill');
  }

  return json;
}

export async function updateVendorBill(input: UpdateVendorBillData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/vendor-bill.php`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to update vendor bill');
  }

  return json;
}

export async function submitVendorBill(vendor_bill_id: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/vendor-bill.php?action=submit`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ vendor_bill_id }),
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to submit vendor bill');
  }

  return json;
}

export async function approveVendorBill(vendor_bill_id: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/vendor-bill.php?action=approve`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ vendor_bill_id }),
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to approve vendor bill');
  }

  return json;
}

export async function rejectVendorBill(vendor_bill_id: string, notes?: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/vendor-bill.php?action=reject`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ vendor_bill_id, notes }),
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to reject vendor bill');
  }

  return json;
}

export async function markVendorBillInstallmentPaid(
  input: MarkVendorBillInstallmentPaidData
): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/vendor-bill.php?action=pay_installment`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to mark installment as paid');
  }

  return json;
}

export async function deleteVendorBill(bill_id: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/vendor-bill.php?bill_id=${bill_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to delete vendor bill');
  }

  return json;
}
