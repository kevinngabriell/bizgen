export interface UOMData{
    uom_id: string;
    uom_name: string;
    conversion_factor: number;
    created_at: string;
    updated_at: string;
}

export interface createUOMData{
    uom_name: string;
    conversion_factor?: number;
}

export interface updateUOMData{
    uom_id: string;
    uom_name?: string;
    conversion_factor?: number;
}

export async function getAllUOM(page: number = 1, limit = 10, search: string = '') : Promise<{data: UOMData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/uom.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch uom');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDetailUOM(uom_id: string = '') : Promise<{ data: UOMData[]; pagination: any }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/uom.php?uom_id=${uom_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //jika statusnya bukan 200 balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch detail UOM');
    }
     
    //jika 200 balikkin data dan pagination
    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function createUOM(input: createUOMData) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/uom.php`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            uom_name: input.uom_name,
            conversion_factor: input.conversion_factor
        }),
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create uom');
    }

    return json;
}

export async function updateUOM(input: updateUOMData): Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/uom.php`, {
        method: 'PUT',
       headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            uom_id: input.uom_id,
            uom_name: input.uom_name,
            conversion_factor: input.conversion_factor
        })
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update uom');
    }

    return json;
}

export async function deleteUOM(uom_id: string) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/uom.php?uom_id=${uom_id}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //Jika tidak berhasil dengan status bukan 201 dan 200, balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || "Failed to delete uom");
    }
    
    return json;
}