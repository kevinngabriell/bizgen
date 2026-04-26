export interface GetSalesOrderNumber {
    number: string;
}

export interface CreateSalesOrderData {
  sales_order_no: string;
  customer_id: string;
  inquiry_ref: string;
  order_date: string;
  sales_person: string;
  service_type: string;
  ship_via_id: string;
  origin_port: string;
  destination_port: string;
  term_id: string;
  remarks: string;
  tax_id: string;
  eta: string;
  etd: string;
  items: CreateSalesOrderItemData[];
}

export interface CreateSalesOrderItemData{
  item_id: string;
  quantity: string;
  unit_price: string;
  dpp: string;
  ppn: string;
  total: string;
  notes: string;
  uom_id: string;
}

export interface GetSalesOrderItemData {
  sales_order_id: string;
  sales_order_no: string;
  created_at: string;
}

export interface GetDetailSalesOrderHeader {
  sales_order_id: string;
  sales_order_no: string;
  order_date: string;
  status: string;
  customer_id: string;
  customer_name: string;
  ship_via_name: string;
  origin_port_name: string;
  destination_port_name: string;
  term_name: string;
  tax_name: string;
  eta: string;
  etd: string;
  sales_person?: string;
  service_type?: string;
  remarks?: string;
  updated_by?: string;
  updated_at?: string;
  created_at?: string;
  created_by?: string;
}

export interface GetDetailSalesOrderItem {
  sales_order_item_id: string;
  item_id?: string;
  item_name: string;
  uom_name: string;
  quantity: number;
  unit_price: number;
  dpp: number;
  ppn: number;
  total: number;
}

export interface GetDetailSalesOrderHistory {
  action: string;
  created_by: string;
  note: string;
  created_at: string;
}

export interface GetDetailSalesOrderResponse {
  header: GetDetailSalesOrderHeader;
  items: GetDetailSalesOrderItem[];
  history: GetDetailSalesOrderHistory[];
}

export interface UpdateSalesOrderData {
  so_id: string;
  order_date?: string;
  sales_person?: string;
  eta?: string;
  etd?: string;
  remarks?: string;
}

export interface ProcessSalesOrderActionData {
  so_id: string;
  action: 'submit' | 'approve' | 'reject';
  notes?: string;
}

export async function generateSalesNumber(): Promise<GetSalesOrderNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/generate-number.php?module_name=sales_order`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch sales order number');
  }

  return json.data;
}

export async function createSalesOrder(input: CreateSalesOrderData) : Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/sales-orders.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sales_order_no: input.sales_order_no,
      customer_id: input.customer_id,
      inquiry_ref: input.inquiry_ref,
      order_date: input.order_date,
      sales_person: input.sales_person,
      service_type: input.service_type,
      ship_via_id: input.ship_via_id,
      origin_port: input.origin_port,
      destination_port: input.destination_port,
      term_id: input.term_id,
      remarks: input.remarks,
      tax_id: input.tax_id,
      eta: input.eta,
      etd: input.etd,
      items: input.items
    })
  });

  const json = await res.json();

  //Jika statusnya bukan 201 atau 200 maka error
  if (json.status_code !== 201 && json.status_code !== 200) {
      throw new Error(json.status_message || 'Failed to create sales costing');
  }

  return json;
}

export async function getSalesOrder(page: number = 1, limit : number = 10, search: string = ''): Promise<{data: GetSalesOrderItemData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/sales-orders.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch sales order');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getSalesOrderByCustomer(customer_id: string): Promise<{data: GetSalesOrderItemData[]; pagination: any}> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/sales-orders.php?customer_id=${customer_id}&status=approved&page=1&limit=1000`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch sales orders by customer');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {},
    };
}

export async function getDetailSalesOrder(so_id: string): Promise<GetDetailSalesOrderResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/sales-orders.php?so_id=${so_id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch sales order detail');
    }

    return json.data;
}

export async function updateSalesOrder(input: UpdateSalesOrderData): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/sales-orders.php`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update sales order');
    }

    return json;
}

export async function processSalesOrderAction(input: ProcessSalesOrderActionData): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/sales-orders.php?action=${input.action}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to process sales order action');
    }

    return json;
}

export async function deleteSalesOrder(so_id: string): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/sales-orders.php?so_id=${so_id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to delete sales order');
    }

    return json;
}

export async function exportSalesOrderPDF(so_id: string): Promise<Blob> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/sales-orders.php?action=export_pdf&so_id=${so_id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Failed to export PDF');

    return res.blob();
}

export async function exportSalesOrderExcel(so_id: string): Promise<Blob> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/report/sales-order.php?sales_order_id=${so_id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Failed to export Excel');

    return res.blob();
}
