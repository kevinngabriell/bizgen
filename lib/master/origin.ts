export interface GetOriginData{
    origin_id: string;
    origin_name: string;
    is_free_trade: number;
    region: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
}

export interface CreateOriginData{
    origin_name: string;
    is_free_trade: number;
    region: string;
}

export async function getAllOrigin(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetOriginData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/origin.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch origin');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDetailOrigin(origin_id: string = '') : Promise<{ data: GetOriginData[]; pagination: any }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/origin.php?origin_id=${origin_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //jika statusnya bukan 200 balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch detail origin');
    }
     
    //jika 200 balikkin data dan pagination
    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function createOrigin(input: CreateOriginData) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const formData = new FormData();

    formData.append('origin_name', String(input.origin_name));
    formData.append('region', String(input.region));

    if (typeof input.is_free_trade === 'boolean') {
        formData.append('is_free_trade', input.is_free_trade ? '1' : '0');
    }

    const res = await fetch(`${baseUrl}master/origin.php`, {
        method: 'POST',
        headers: {
                Authorization: `Bearer ${token}`,
            },
        body: formData,
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create origin');
    }

    return json;
}

export async function updateOrigin(){

}

export async function deleteOrigin(origin_id: string) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/origin.php?origin_id=${origin_id}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //Jika tidak berhasil dengan status bukan 201 dan 200, balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || "Failed to delete origin");
    }
    
    return json;
}