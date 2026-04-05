export interface GetQuotationNumber {
    number: string;
}

export interface CreateSalesQuotationsData {
    quotation_number: string;
    customer_id: string;
    quotation_date: string;
    valid_until: string;
    currency: string;
    subtotal: string;
    total_amount: string;
    inquiry_id: string;
    items: CreateSalesQuotationsDataItem[];
}

export interface CreateSalesQuotationsDataItem {
    item_name: string;
    description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface GetSalesQuotationsData {
    sales_quotation_id: string;
    sales_quotation_number: string;
    customer_name: string;
    currency_symbol: string;
    quotation_status: string;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
}

export interface GetDetailQuotationHeader {
    sales_quotation_id: string;
    sales_quotation_number: string;
    quotation_date: string;
    valid_until: string;
    quotation_status: string;
    customer_name: string;
    currency_code: string;
    currency_symbol: string;
    subtotal: number;
    total_amount: number;
    updated_at: string;
    updated_by: string;
}

export interface GetDetailQuotationItem {
    sales_quotation_item_id: string;
    item_name: string;
    description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface GetDetailQuotationHistory {
    action: string;
    action_by: string;
    notes: string;
    created_at: string;
}

export interface GetDetailQuotationResponse {
    header: GetDetailQuotationHeader;
    items: GetDetailQuotationItem[];
    history: GetDetailQuotationHistory[];
}

export interface UpdateSalesQuotationItem {
    item_name: string;
    description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface UpdateSalesQuotationData {
    quotation_id: string;
    quotation_date?: string;
    valid_until?: string;
    subtotal?: string;
    total_amount?: string;
    items?: UpdateSalesQuotationItem[];
}

export interface ProcessSalesQuotationActionData {
    quotation_id: string;
    action: 'send' | 'approve' | 'reject';
    notes?: string;
}

export async function generateQuotationNumber(): Promise<GetQuotationNumber>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/generate-number.php?module_name=quotation`, {
        method: 'GET',
        headers: {
        Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch quotation number');
    }

    return json.data; // ⬅️ object { number: string }
}


export async function createSalesQuotation(input: CreateSalesQuotationsData) : Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/quotations.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quotation_number: input.quotation_number,
      customer_id: input.customer_id,
      quotation_date: input.quotation_date,
      valid_until: input.valid_until,
      currency: input.currency,
      subtotal: input.subtotal,
      total_amount: input.total_amount,
      inquiry_id: input.inquiry_id,
      items: input.items
    })
  });

  const json = await res.json();

  //Jika statusnya bukan 201 atau 200 maka error
  if (json.status_code !== 201 && json.status_code !== 200) {
      throw new Error(json.status_message || 'Failed to create sales quotations');
  }

  return json;
}


export async function getSalesQuotations(page: number = 1, limit : number = 10, search: string = ''): Promise<{data: GetSalesQuotationsData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/quotations.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch sales quotations');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDetailSalesQuotation(quotation_id: string): Promise<GetDetailQuotationResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/quotations.php?quotation_id=${quotation_id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch sales quotation detail');
    }

    return json.data;
}

export async function updateSalesQuotation(input: UpdateSalesQuotationData): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/quotations.php`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update sales quotation');
    }

    return json;
}

export async function processSalesQuotationAction(input: ProcessSalesQuotationActionData): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/quotations.php?action=${input.action}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to process sales quotation action');
    }

    return json;
}

export async function deleteSalesQuotation(quotation_id: string): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/quotations.php?quotation_id=${quotation_id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to delete sales quotation');
    }

    return json;
}
