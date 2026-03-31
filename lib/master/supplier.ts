export interface GetSupplierData{
    supplier_id: string;
    supplier_name: string;
    origin_id: string;
    origin_name: string;
    currency_id: string;
    currency_name: string;
    term_id: string;
    term_name: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
}

export interface createSupplierData{
    supplier_name: string;
    supplier_origin: string;
    supplier_address?: string;
    supplier_phone?: string;
    supplier_pic_name?: string;
    supplier_pic_contact?: string;
    supplier_currency?: string;
    supplier_term?: string;
    supplier_bank_information?: string;
}

export interface updateSupplierData{
    supplier_id: string;
    supplier_name?:string;
    supplier_origin? : string;
    supplier_address? : string;
    supplier_phone? : string;
    supplier_pic_name? : string;
    supplier_pic_contact? : string;
    supplier_currency? : string;
    supplier_term? : string;
    supplier_bank_information? : string;
};

export async function getAllSupplier(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetSupplierData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/supplier.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch supplier');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDetailSupplier(supplier_id: string = '') : Promise<{ data: GetSupplierData[]; pagination: any }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/supplier.php?supplier_id=${supplier_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //jika statusnya bukan 200 balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch detail supplier');
    }
     
    //jika 200 balikkin data dan pagination
    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function createSupplier(input: createSupplierData): Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/supplier.php`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            supplier_name: input.supplier_name,
            supplier_origin: input.supplier_origin,
            supplier_address: input.supplier_address,
            supplier_phone: input.supplier_phone,
            supplier_pic_name: input.supplier_pic_name,
            supplier_pic_contact: input.supplier_pic_contact,
            supplier_currency: input.supplier_currency,
            supplier_term: input.supplier_term,
            suppplier_bank_information: input.supplier_bank_information
        }),
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create supplier');
    }

    return json;
}

export async function updateSupplier(input: updateSupplierData): Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/supplier.php`, {
        method: 'PUT',
       headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            supplier_id: input.supplier_id,
            supplier_name: input.supplier_name,
            supplier_origin: input.supplier_origin,
            supplier_address: input.supplier_address,
            supplier_phone: input.supplier_phone,
            supplier_pic_name : input.supplier_pic_name,
            supplier_pic_contact : input.supplier_pic_contact,
            supplier_currency: input.supplier_currency,
            supplier_term: input.supplier_term,
            supplier_bank_information: input.supplier_bank_information
        })
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update supplier');
    }

    return json;
}

export async function deleteSupplier(supplier_id: string) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/supplier.php?supplier_id=${supplier_id}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //Jika tidak berhasil dengan status bukan 201 dan 200, balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || "Failed to delete supplier");
    }
    
    return json;
}