export interface CreateRfqItems {
    item_name: string;
    uom_id: string;
    quantity: number;
    hs_code?: string;
    weight_kg?: number;
    cbm?: number;
    packaging?: string;
}

export interface CreateRfq {
    sales_rfq_number: string;
    customer_name: string;
    pic_customer_name: string;
    phone_whatsapp: string;
    ship_via_id: string;
    origin_id: string;
    destination_id: string;
    incoterm_id: string;
    commodity_id: string;
    remarks?: string;   // optional
    items: CreateRfqItems[];
}

export interface GetRfqNumber {
    number: string;
}

export interface GetRfq {
    sales_rfq_id: string;
    sales_rfq_number: string;
    rfq_status: string;
    created_at: string;
    customer_name: string;
    ship_via_name: string;
    origin: string;
    destination: string;
    term_id: string;
    commodity_name: string;
}

export interface GetDetailRfq {
  rfq_status: string;
  updated_at: string;
    sales_rfq_id: string;
    sales_rfq_number: string;
    customer_name: string;
    phone_whatsapp: string;
    pic_customer_name: string;
    ship_via_id: string;
    ship_via_name: string;
    origin_id: string;
    origin_name: string;
    destination_id: string;
    commodity_id: string;
    commodity_name: string;
    incoterm_id: string;
    term_name: string;
    remarks: string;
}

export interface GetDetailRfqItem {
  sales_rfq_item_id: string;
  item_name: string;
  hs_code?: string;
  quantity: number;
  uom_id: string;
  uom_name: string;
  weight_kg?: number;
  cbm?: number;
  packaging?: string;
}

export interface GetDetailRfqHistory {
  action: string;
  action_by: string;
  action_at: string;
  notes: string;
}

export interface GetDetailRfqResponse {
  header: GetDetailRfq;
  items: GetDetailRfqItem[];
  history: GetDetailRfqHistory[];
}

export async function createSalesRfq(input: CreateRfq) : Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/inquiries.php`, {
        method: 'POST',
       headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sales_rfq_number: input.sales_rfq_number,
            customer_name: input.customer_name,
            pic_customer_name: input.pic_customer_name,
            phone_whatsapp: input.phone_whatsapp,
            ship_via_id: input.ship_via_id,
            origin_id: input.origin_id,
            destination_id: input.destination_id,
            incoterm_id: input.incoterm_id,
            commodity_id: input.commodity_id,
            remarks: input.remarks,
            items: input.items
        })
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create sales rfq');
    }

    return json;
}

export async function generateRfqNumber(): Promise<GetRfqNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/generate-number.php?module_name=rfq`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch rfq number');
  }

  return json.data; // ⬅️ object { number: string }
}

export async function getSalesRfq(page: number = 1, limit : number = 10, search: string = ''): Promise<{data: GetRfq[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/inquiries.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch rfq');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDetailSalesRfq(
  sales_rfq_id: string
): Promise<GetDetailRfqResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${baseUrl}sales/inquiries.php?sales_rfq_id=${sales_rfq_id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || "Failed to fetch RFQ detail");
  }

  return json.data;
}