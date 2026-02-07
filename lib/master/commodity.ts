export interface GetCommodityData{
    commodity_id: string;
    commodity_code: string;
    commodity_name: string;
    is_dangerous_good: number;
    requires_special_handling: number;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
}

export interface CreateCommodityData{
    commodity_code: string;
    commodity_name: string;
    is_dangerous_goods: boolean;
    requires_special_handling: boolean;
    is_active?: boolean;
}


export async function getAllCommodity(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetCommodityData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/commodity.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch commodity');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDetailCommodity(commodity_id: string = '') : Promise<{ data: GetCommodityData | null }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/commodity.php?commodity_id=${commodity_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //jika statusnya bukan 200 balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch detail commodity');
    }
     
    //jika 200 balikkin data dan pagination
    return {
        data: json.data?.data || []
    };
}

export async function createCommodity(input: CreateCommodityData) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const formData = new FormData();

    formData.append('commodity_code', String(input.commodity_code));
    formData.append('commodity_name', String(input.commodity_name));
    formData.append('is_dangerous_goods', String(input.is_dangerous_goods));
    formData.append('requires_special_handling', String(input.requires_special_handling));

    if (typeof input.is_active === 'boolean') {
        formData.append('is_active', input.is_active ? '1' : '0');
    }

    const res = await fetch(`${baseUrl}master/commodity.php`, {
        method: 'POST',
        headers: {
                Authorization: `Bearer ${token}`,
            },
        body: formData,
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create commodity');
    }

    return json;
}

export async function updateCommodity(){

}

export async function deleteCommodity(commodity_id: string) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/commodity.php?commodity_id=${commodity_id}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //Jika tidak berhasil dengan status bukan 201 dan 200, balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || "Failed to delete commodity");
    }
    
    return json;
}