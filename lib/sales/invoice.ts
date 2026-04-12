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

export interface GetDetailInvoiceHeader {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  customer_name: string;
  currency_code: string;
  exchange_rate_to_idr: number;
  sales_order_no: string;
  delivery_order_no: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  notes: string;
  updated_by: string;
  updated_at: string;
}

export interface GetDetailInvoiceItem {
  item_id: string;
  item_name: string;
  uom_name: string;
  quantity: number;
  unit_price: number;
  tax_percent: number;
  tax_amount: number;
  line_total: number;
}

export interface GetDetailInvoiceHistory {
  action: string;
  created_by: string;
  note: string;
  created_at: string;
}

export interface GetDetailInvoiceResponse {
  header: GetDetailInvoiceHeader;
  items: GetDetailInvoiceItem[];
  history: GetDetailInvoiceHistory[];
}

export interface UpdateSalesInvoiceItemData {
  item_id?: string;
  _delete?: boolean;
  items_id?: string;
  quantity?: number;
  unit_price?: number;
  tax?: number;
  total?: number;
}

export interface UpdateSalesInvoiceData {
  invoice_id: string;
  invoice_date?: string;
  due_date?: string;
  exchange_rate_to_idr?: string;
  subtotal_amount?: string;
  tax_amount?: string;
  grand_total?: string;
  grand_total_idr?: string;
  notes?: string;
  items?: UpdateSalesInvoiceItemData[];
}

export interface ProcessSalesInvoiceActionData {
  invoice_id: string;
  action: 'submit' | 'approve' | 'reject';
  notes?: string;
}

export interface SalesInvoiceExistsCheck {
  exists: boolean;
  total_invoice: number;
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

export async function getDetailSalesInvoice(invoice_id: string): Promise<GetDetailInvoiceResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/invoices.php?invoice_id=${invoice_id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch sales invoice detail');
    }

    return json.data;
}

export async function updateSalesInvoice(input: UpdateSalesInvoiceData): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/invoices.php`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update sales invoice');
    }

    return json;
}

export async function processSalesInvoiceAction(input: ProcessSalesInvoiceActionData): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/invoices.php?action=${input.action}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to process sales invoice action');
    }

    return json;
}

export async function getInvoiceBySalesOrderId(sales_order_id: string): Promise<SalesInvoiceExistsCheck | null> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/invoices.php?sales_order_id=${sales_order_id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200 && json.status_code !== 404) {
        throw new Error(json.status_message || 'Failed to fetch invoice by sales order id');
    }

    if (json.status_code === 404 || !json.data) {
        return null;
    }

    return json.data;
}

export async function deleteSalesInvoice(invoice_id: string): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/invoices.php?invoice_id=${invoice_id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to delete sales invoice');
    }

    return json;
}
