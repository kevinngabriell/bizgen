export interface GetAccountCodeData{
    account_code_id: string;
    account_code: string;
    account_code_name: string;
    account_code_name_alias: string;
    account_type: string;
    parent_account_code_id: string;
    is_active: boolean;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
}

export interface CreateAccountCodeData{
    account_code: string;
    account_code_name: string;
    account_code_name_alias?: string;
    account_type: string;
    parent_account_code_id?: string;
}

export interface UpdateAccountCodeData {
    account_code_id: string;
    account_code_name?: string;
    account_code_name_alias?: string;
    account_type?: string;
    parent_account_code_id?: string;
    is_active?: boolean;
}

export async function getAllAccountCode(page: number = 1, limit = 10, params: string = '') : Promise<{data: GetAccountCodeData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/account-code.php?page=${page}&limit=${limit}&params=${params}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch account code');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDetailAccountCode(account_code_id: string = '') : Promise<{ data: GetAccountCodeData | null }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/account-code.php?account_code_id=${account_code_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //jika statusnya bukan 200 balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch detail account code');
    }
     
    //jika 200 balikkin data dan pagination
    return {
        data: json.data?.data || []
    };
}

export async function createAccountCode(input: CreateAccountCodeData) : Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/account-code.php`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            account_code: input.account_code,
            account_code_name: input.account_code_name,
            account_code_name_alias: input.account_code_name_alias,
            account_type: input.account_type,
            parent_account_code_id: input.parent_account_code_id
        })
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create account code');
    }

    return json;
}


export async function updateAccountCode(input: UpdateAccountCodeData) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/account-code.php`, {
       method: 'PUT',
       headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            account_code_id : input.account_code_id,
            account_code_name : input.account_code_name,
            account_code_name_alias : input.account_code_name_alias,
            account_type : input.account_type,
            parent_account_code_id : input.parent_account_code_id,
            is_active : input.is_active
        }),
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update account code');
    }

    return json;
    
}

export async function deleteAccountCode(account_code_id: string): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/account-code.php?account_code_id=${account_code_id}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //Jika tidak berhasil dengan status bukan 201 dan 200, balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || "Failed to delete account code");
    }
    
    return json;
}