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

export interface GetDetailProfitHeader {
  profit_summary_id: string;
  sales_profit_no: string;
  status: string;
  customer_name: string;
  currency_code: string;
  sales_order_no: string;
  exchange_rate_to_idr: number;
  revenue_total_usd: number;
  cost_total_usd: number;
  gross_profit_usd: number;
  gross_profit_idr: number;
  updated_by?: string;
  updated_at?: string;
}

export interface GetDetailProfitItem {
  revenue_item_id: string;
  item_name: string;
  quantity: number;
  landed_cost: number;
  selling_price: number;
}

export interface GetDetailProfitHistory {
  action: string;
  action_by: string;
  notes: string;
  created_at: string;
}

export interface GetDetailProfitResponse {
  header: GetDetailProfitHeader;
  items: GetDetailProfitItem[];
  history: GetDetailProfitHistory[];
}

export interface UpdateSalesProfitItemData {
  revenue_item_id?: string;
  item_id: string;
  quantity: string;
  landed_cost: string;
  selling_price: string;
}

export interface UpdateSalesProfitData {
  profit_id: string;
  exchange_rate_to_idr?: string;
  revenue_total_usd?: string;
  cost_total_usd?: string;
  gross_profit_usd?: string;
  gross_profit_idr?: string;
  items?: UpdateSalesProfitItemData[];
}

export interface ProcessSalesProfitActionData {
  profit_id: string;
  action: 'submit' | 'approve' | 'reject';
  notes?: string;
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

export async function getDetailSalesProfit(profit_id: string): Promise<GetDetailProfitResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/profit-summary.php?profit_id=${profit_id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch sales profit detail');
    }

    return json.data;
}

export async function updateSalesProfit(input: UpdateSalesProfitData): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/profit-summary.php`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update sales profit');
    }

    return json;
}

export async function processSalesProfitAction(input: ProcessSalesProfitActionData): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/profit-summary.php?action=${input.action}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to process sales profit action');
    }

    return json;
}

export interface SalesProfitExistsCheck {
    exists: boolean;
    total: number;
}

export async function getProfitBySalesOrderId(sales_order_id: string): Promise<SalesProfitExistsCheck | null> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/profit-summary.php?sales_order_id=${sales_order_id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200 || !json.data) {
        throw new Error(json.status_message || 'Failed to check profit summary');
    }

    return json.data;
}

export async function deleteSalesProfit(profit_id: string): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/profit-summary.php?profit_id=${profit_id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to delete sales profit');
    }

    return json;
}
