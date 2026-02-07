export interface GetIncotermData{
    incoterm_id: string;
    incoterm_code: string;
    incoterm_name: string;
    description: string;
    is_active: number;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
}

export interface CreateincotermData{
    incoterm_code: string;
    incoterm_name: string;
    description?: string;
    is_active?: boolean;
}

export async function getAllIncoterm(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetIncotermData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/incoterm.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch incoterm');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDetailIncoterm(incoterm_id: string = '') : Promise<{ data: GetIncotermData[]; pagination: any }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/incoterm.php?incoterm_id=${incoterm_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //jika statusnya bukan 200 balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch detail incoterm');
    }
     
    //jika 200 balikkin data dan pagination
    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function createIncoterm(input: CreateincotermData): Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const formData = new FormData();

    formData.append('incoterm_code', String(input.incoterm_code));
    formData.append('incoterm_name', String(input.incoterm_name));

    if (input.description) {
        formData.append('description', input.description);
    }

    if (typeof input.is_active === 'boolean') {
        formData.append('is_active', input.is_active ? '1' : '0');
    }

    const res = await fetch(`${baseUrl}master/incoterm.php`, {
        method: 'POST',
        headers: {
                Authorization: `Bearer ${token}`,
            },
        body: formData,
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create incoterm');
    }

    return json;
}

export async function updateIncoterm(){

}

export async function deleteIncoterm(incoterm_id: string) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/incoterm.php?incoterm_id=${incoterm_id}`, {
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