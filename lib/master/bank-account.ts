export interface GetBankAccountData{
    bank_account_id: string;
    bank_number: string;
    bank_name: string;
    bank_branch: string;
    currency_id: string;
    currency_name: string;
    currency_symbol: string;
    is_primary: boolean;
    company_id: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
}

export interface CreateBankAccountData{
    bank_number: string;
    bank_name: string;
    currency_id: string;
    bank_branch?: string;
    is_primary?: boolean;
}

export interface UpdateBankAccountData{
    bank_account_id: string;
    bank_name?: string;
    currency_id?: string;
    bank_branch?: string;
    is_primary?: boolean;
}

export async function getAllBankAccount(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetBankAccountData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/bank-account.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch bank account');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDetailBankAccount(bank_account_id: string = '') : Promise<{ data: GetBankAccountData | null }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/bank-account.php?bank_account_id=${bank_account_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //jika statusnya bukan 200 balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch detail bank account');
    }
     
    //jika 200 balikkin data dan pagination
    return {
        data: json.data?.data || []
    };
}

export async function createBankAccount(input: CreateBankAccountData) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/bank-account.php`, {
        method: 'POST',
       headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            bank_number : input.bank_number,
            bank_name : input.bank_name,
            currency_id : input.currency_id,
            bank_branch : input.bank_branch,
            is_primary : input.is_primary
        }),
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create bank account');
    }

    return json;
    
}

export async function updateBankAccount(input: UpdateBankAccountData) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/bank-account.php`, {
       method: 'PUT',
       headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            bank_account_id : input.bank_account_id,
            bank_name : input.bank_name,
            currency_id : input.currency_id,
            bank_branch : input.bank_branch,
            is_primary : input.is_primary
        }),
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update bank account');
    }

    return json;
    
}

export async function deleteBankAccount(bank_account_id: string) : Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/bank-account.php?bank_account_id=${bank_account_id}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //Jika tidak berhasil dengan status bukan 201 dan 200, balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || "Failed to delete bank account");
    }
    
    return json;
}