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