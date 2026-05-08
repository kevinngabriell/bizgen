export interface FinanceTransactionData {
  category: string;
  bank_account: string;
  amount: number;
  date: string;
  voucher_no?: string;
  memo?: string;
  details: FinanceTransactionDetailData[];
}

export interface FinanceTransactionDetailData {
  account_code: string;
  account_amount: number;
  account_memo?: string;
}

export interface FinanceLedgerListItem {
  transaction_id: string;
  category: 'income' | 'expense';
  voucher_no: string;
  transaction_date: string;
  memo: string;
  amount: string;
  transaction_status: string;
  created_at: string;
  created_by: string;
  bank_name: string;
  bank_account_number: string;
  currency_code: string;
  currency_symbol: string;
}

export interface FinanceLedgerDetailItem {
  transaction_detail_id: string;
  account_amount: number;
  memo: string;
  account_code_id: string;
  account_code_name: string;
}

export interface FinanceLedgerDetail {
  header: FinanceLedgerListItem;
  details: FinanceLedgerDetailItem[];
}

export interface FinanceIncomeExpenseSummary {
  currency_symbol: string;
  total_income: string;
  total_expense: string;
  net_balance: string;
}

export interface FinanceSummaryReceivables {
  customer_invoices_pending_count: number;
  unpaid_receivables_overdue_amount: number;
  unpaid_receivables_overdue_count: number;
  payment_received_today_amount: number;
  payment_received_today_count: number;
}

export interface FinanceSummaryPayables {
  outstanding_vendor_bills_amount: number;
  approved_expenses_amount: number;
  paid_bills_amount: number;
}

export interface FinanceSummaryData {
  outstanding_receivables: number;
  outstanding_payables: number;
  cashflow_balance: number;
  receivables: FinanceSummaryReceivables;
  payables: FinanceSummaryPayables;
  income_expense: FinanceIncomeExpenseSummary[];
}

export async function createFinanceTransaction(input: FinanceTransactionData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/transaction.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 201 && (json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to create finance transaction');
  }

  return json;
}

export async function getFinanceSummary(): Promise<FinanceSummaryData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/summary.php`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to fetch finance summary');
  }

  return {
    outstanding_receivables: json.data?.outstanding_receivables ?? 0,
    outstanding_payables: json.data?.outstanding_payables ?? 0,
    cashflow_balance: json.data?.cashflow_balance ?? 0,
    receivables: json.data?.receivables ?? {},
    payables: json.data?.payables ?? {},
    income_expense: json.data?.data ?? [],
  };
}

export async function getLedgerList(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  category?: 'income' | 'expense'
): Promise<{ data: FinanceLedgerListItem[]; pagination: any }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  let url = `${baseUrl}finance/transaction.php?page=${page}&limit=${limit}&params=${search}`;
  if (category) url += `&category=${category}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to fetch ledger');
  }

  return {
    data: json.data?.data || [],
    pagination: json.data?.pagination || {},
  };
}

export async function getLedgerDetail(transaction_id: string): Promise<FinanceLedgerDetail> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}finance/transaction.php?transaction_id=${transaction_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();

  if ((json.status ?? json.status_code) !== 200) {
    throw new Error(( json.message ?? json.status_message) || 'Failed to fetch ledger detail');
  }

  return json.data;
}
