export interface GetCustomerData{
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    customer_pic_name: string;
    customer_pic_contact: string;
    customer_top: number;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
    company_id: string;
}

export interface CreateCustomerData{
    customer_name: string;
    customer_phone: string;
    customer_address?: string;
    customer_pic_name?: string;
    customer_pic_contact?: string;
    customer_top?: number;
}

export interface UpdateCustomerdata {
    customer_id?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_address?: string;
    customer_pic_name?: string;
    customer_pic_contact?: string;
    customer_top?: number;
}

export async function getAllCustomer(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetCustomerData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/customer.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch customer');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDetailCustomer(customer_id: string = '') : Promise<{ data: GetCustomerData[]; pagination: any }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/customer.php?customer_id=${customer_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //jika statusnya bukan 200 balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch detail customer');
    }
     
    //jika 200 balikkin data dan pagination
    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function createCustomer(input: CreateCustomerData) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/customer.php`, {
        method: 'POST',
       headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            customer_name: input.customer_name,
            customer_phone: input.customer_phone,
            customer_address: input.customer_address,
            customer_pic_name : input.customer_pic_name,
            customer_pic_contact : input.customer_pic_contact,
            customer_top : input.customer_top
        }),
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create customer');
    }

    return json;
}

export async function updateCustomer(input: UpdateCustomerdata) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/customer.php`, {
        method: 'PUT',
       headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            customer_id: input.customer_id,
            customer_name: input.customer_name,
            customer_phone: input.customer_phone,
            customer_address: input.customer_address,
            customer_pic_name : input.customer_pic_name,
            customer_pic_contact : input.customer_pic_contact,
            customer_top : input.customer_top
        }),
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update customer');
    }

    return json;
}

export async function deleteCustomer(customer_id: string) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/customer.php?customer_id=${customer_id}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //Jika tidak berhasil dengan status bukan 201 dan 200, balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || "Failed to delete customer");
    }
    
    return json;
}