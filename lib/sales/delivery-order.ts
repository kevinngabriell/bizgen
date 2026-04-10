export interface GetSalesDeliveryNumber {
    number: string;
}

export interface CreateSalesDeliveryData {
  do_number: string;
  issue_date: string;
  sales_order_id: string;
  customer_id: string;
  delivery_date: string;
  remarks: string;
  items: CreateSalesDeliveryItemData[];
}

export interface CreateSalesDeliveryItemData {
  items_id: string;
  quantity: string;
  uom_id: string;
  notes: string;
}

export interface GetSalesDeliveryItemData {
  delivery_order_id: string;
  do_number: string;
  created_at: string;
}

export interface GetDetailDeliveryHeader {
  delivery_order_id: string;
  delivery_order_no: string;
  status: string;
  issue_date: string;
  delivery_date: string;
  customer_name: string;
  sales_order_no: string;
  warehouse_name: string;
  remarks: string;
  updated_by?: string;
  updated_at?: string;
  created_by?: string;
  created_at?: string;
}

export interface GetDetailDeliveryItem {
  delivery_order_item_id: string;
  item_name: string;
  uom_name: string;
  quantity: number;
  notes: string;
}

export interface GetDetailDeliveryHistory {
  action: string;
  created_by: string;
  note: string;
  created_at: string;
}

export interface GetDetailDeliveryResponse {
  header: GetDetailDeliveryHeader;
  items: GetDetailDeliveryItem[];
  history: GetDetailDeliveryHistory[];
}

export interface UpdateDeliveryOrderData {
  delivery_id: string;
  issue_date?: string;
  delivery_date?: string;
  remarks?: string;
}

export interface ProcessDeliveryOrderActionData {
  delivery_id: string;
  action: 'submit' | 'approve' | 'reject';
  notes?: string;
}

export async function generateSalesDeliveryNumber(): Promise<GetSalesDeliveryNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/generate-number.php?module_name=delivery_order`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch sales delivery number');
  }

  return json.data;
}

export async function createDeliveryOrder(input: CreateSalesDeliveryData) : Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/delivery-orders.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      do_number: input.do_number,
      issue_date: input.issue_date,
      sales_order_id: input.sales_order_id,
      customer_id: input.customer_id,
      delivery_date: input.delivery_date,
      remarks: input.remarks,
      items: input.items
    })
  });

  const json = await res.json();

  //Jika statusnya bukan 201 atau 200 maka error
  if (json.status_code !== 201 && json.status_code !== 200) {
      throw new Error(json.status_message || 'Failed to create sales delivery');
  }

  return json;
}

export async function getSalesdeliveryOrder(page: number = 1, limit : number = 10, search: string = ''): Promise<{data: GetSalesDeliveryItemData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/delivery-orders.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch sales delivery order');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDeliveryOrderBySalesOrderId(sales_order_id: string): Promise<GetSalesDeliveryItemData | null> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/delivery-orders.php?sales_order_id=${sales_order_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200 && json.status_code !== 404) {
        throw new Error(json.status_message || 'Failed to fetch delivery order by sales order id');
    }

    // Return null if no delivery order found (404) or empty data
    if (json.status_code === 404 || !json.data) {
        return null;
    }

    return json.data;
}

export async function getDetailDeliveryOrder(delivery_id: string): Promise<GetDetailDeliveryResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/delivery-orders.php?delivery_id=${delivery_id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch delivery order detail');
    }

    return json.data;
}

export async function updateDeliveryOrder(input: UpdateDeliveryOrderData): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/delivery-orders.php`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update delivery order');
    }

    return json;
}

export async function processDeliveryOrderAction(input: ProcessDeliveryOrderActionData): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/delivery-orders.php?action=${input.action}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to process delivery order action');
    }

    return json;
}

export async function deleteDeliveryOrder(delivery_id: string): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/delivery-orders.php?delivery_id=${delivery_id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to delete delivery order');
    }

    return json;
}
