export interface GetSalesCostingNumber {
    number: string;
}

export interface CreateCostingData {
  sales_costing_no: string;
  booking_no: string;
  customer_id: string;
  ship_via_id: string;
  origin_port: string;
  destination_port: string;
  notes: string;
  items: CreateCostingItemsData[];
}

export interface CreateCostingItemsData {
  costing_category_id: string;
  description: string;
  supplier: string;
  notes: string;
  currency_id: string;
  exchange_rate: string;
  amount: string;
}

export interface GetSalesCostingData {
  sales_costing_expense_id: string;
  sales_costing_no: string;
  created_at: string;
}

export async function generateSalesCostingNumber(): Promise<GetSalesCostingNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/generate-number.php?module_name=costing`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch sales costing number');
  }

  return json.data;
}

export async function createSalesCosting(input: CreateCostingData) : Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/costings.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sales_costing_no: input.sales_costing_no,
      booking_no: input.booking_no,
      customer_id: input.customer_id,
      ship_via_id: input.ship_via_id,
      origin_port: input.origin_port,
      destination_port: input.destination_port,
      notes: input.notes,
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

export async function getSalesCosting(page: number = 1, limit : number = 10, search: string = ''): Promise<{data: GetSalesCostingData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/costings.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch sales costing');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}