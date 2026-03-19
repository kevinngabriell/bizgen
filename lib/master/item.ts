export interface GetItemData{
    item_id: string;
    item_code: string;
    item_name: string;
    item_description: string;
    item_type: string;
    company_id: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
    default_uom: string;
    is_active: string;
}

export interface CreateItemData{
    item_code: string;
    item_name: string;
    item_type?: string;
    item_description?: string;
    default_uom?: string;
    is_active?: string;
}

export interface UpdateItemData {
    item_id?: string;
    item_code?: string;
    item_name?: string;
    item_type?: string;
    item_description?: string;
    default_uom?: string;
    is_active?: string;
}

export async function getAllItem(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetItemData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/items.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch item');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDetailItem(item_id: string = '') : Promise<{ data: GetItemData[]; pagination: any }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/items.php?item_id=${item_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //jika statusnya bukan 200 balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch detail item');
    }
     
    //jika 200 balikkin data dan pagination
    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function createItem(input: CreateItemData): Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/items.php`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            item_code: input.item_code,
            item_name: input.item_name,
            item_type: input.item_type,
            item_description: input.item_description,
            default_uom: input.default_uom,
            is_active: input.is_active
        })
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create item');
    }

    return json;
}

export async function updateItem(input: UpdateItemData): Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/items.php`, {
        method: 'PUT',
       headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            item_id: input.item_id,
            item_code: input.item_code,
            item_name: input.item_name,
            item_type: input.item_type,
            item_description: input.item_description,
            default_uom: input.default_uom,
            is_active: input.is_active
        })
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update items');
    }

    return json;
}

export async function deleteItem(item_id: string): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/items.php?item_id=${item_id}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //Jika tidak berhasil dengan status bukan 201 dan 200, balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || "Failed to delete item");
    }
    
    return json;
}