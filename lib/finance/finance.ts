export interface FinanceTransactionData { 
    category: string;
    bank_account: string;
    amount: string;
    date: string;
    memo: string;
    details: FinanceTransactionDetailData[];
}

export interface FinanceTransactionDetailData { 
    account_code: string;
    account_amount: string;
    account_memo: string;
}

export interface FinanceIncomeExpenseSummary{
    currency_symbol: string;
    total_income: string;
    total_expense: string;
    net_balance: string;
}

export async function createFinanceTransaction(input: FinanceTransactionData) : Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}finance/transaction.php`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({   
            category: input.category,
            bank_account: input.bank_account,
            amount: input.amount,
            date: input.date,
            memo: input.memo,
            details: input.details
        })
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create finance transaction');
    }

    return json;
}

export async function getFinanceIncomeExpenseSummary() : Promise<{data: FinanceIncomeExpenseSummary[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}finance/summary.php`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch finance summary');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}