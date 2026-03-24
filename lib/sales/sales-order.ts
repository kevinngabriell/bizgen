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
}

export interface GetSalesOrderItemData {
  sales_order_id: string;
  sales_order_no: string;
  created_at: string;
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