export interface GetSalesInvoiceNumber {
    number: string;
}

export interface CreateSalesInvoiceData{
  invoice_number: string;
  customer_id: string;
  currency_id: string;
  sales_order_id: string;
  delivery_order_id: string;
  invoice_date: string;
  due_date: string;
  exchange_rate_to_idr: string;
  subtotal_amount: string;
  tax_percent: string;
  tax_amount: string;
  grand_total: string;
  grand_total_idr: string;
  items:CreateSalesInvoiceItemData[];
}

export interface CreateSalesInvoiceItemData{
  items_id: string;
  quantity: string;
  unit_price: string;
  tax: string;
  total: string;
}

export interface GetSalesInvoiceItemData {
  invoice_id: string;
  invoice_number: string;
  created_at: string;
}

export async function generateSalesInvoiceNumber(): Promise<GetSalesInvoiceNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/generate-number.php?module_name=invoice`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch sales invoice number');
  }

  return json.data;
}

export async function createSalesInvoice(input: CreateSalesInvoiceData) : Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/invoices.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invoice_number: input.invoice_number,
      customer_id: input.customer_id,
      currency_id: input.currency_id,
      sales_order_id: input.sales_order_id,
      delivery_order_id: input.delivery_order_id,
      invoice_date: input.invoice_date,
      due_date: input.due_date,
      exchange_rate_to_idr: input.exchange_rate_to_idr,
      subtotal_amount: input.subtotal_amount,
      tax_percent: input.tax_percent,
      tax_amount: input.tax_amount,
      grand_total: input.grand_total,
      grand_total_idr: input.grand_total_idr,
      items: input.items
    })
  });

  const json = await res.json();

  //Jika statusnya bukan 201 atau 200 maka error 
  if (json.status_code !== 201 && json.status_code !== 200) {
      throw new Error(json.status_message || 'Failed to create sales invoice summary');
  }

  return json;
}

export async function getSalesInvoice(page: number = 1, limit : number = 10, search: string = ''): Promise<{data: GetSalesInvoiceItemData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/invoices.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch sales invoices');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}