export interface GetSalesProfitNumber {
    number: string;
}

export interface CreateProfitSummaryData {
  sales_profit_no: string;
  sales_order_id: string;
  customer_id: string;
  currency_id: string;
  exchange_rate_to_idr: string;
  revenue_total_usd: string;
  cost_total_usd: string;
  gross_profit_usd: string;
  gross_profit_idr: string;
  items: CreateProfitSummaryItemData[];
}

export interface CreateProfitSummaryItemData{
  item_id: string;
  quantity: string;
  landed_cost: string;
  selling_price: string;
}

export interface GetSalesProfitItemData {
  profit_summary_id: string;
  sales_profit_no: string;
  created_at: string;
}


export async function generateSalesProfitNumber(): Promise<GetSalesProfitNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/generate-number.php?module_name=profit`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch sales profit number');
  }

  return json.data;
}

export async function createSalesProfit(input: CreateProfitSummaryData) : Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/profit-summary.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sales_profit_no: input.sales_profit_no,
      sales_order_id: input.sales_order_id,
      customer_id: input.customer_id,
      currency_id: input.currency_id,
      exchange_rate_to_idr: input.exchange_rate_to_idr,
      revenue_total_usd: input.revenue_total_usd,
      cost_total_usd: input.cost_total_usd,
      gross_profit_usd: input.gross_profit_usd,
      gross_profit_idr: input.gross_profit_idr,
      items: input.items
    })
  });

  const json = await res.json();

  //Jika statusnya bukan 201 atau 200 maka error 
  if (json.status_code !== 201 && json.status_code !== 200) {
      throw new Error(json.status_message || 'Failed to create sales profit summary');
  }

  return json;
}

export async function getSalesProfit(page: number = 1, limit : number = 10, search: string = ''): Promise<{data: GetSalesProfitItemData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/profit-summary.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch sales profit');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}