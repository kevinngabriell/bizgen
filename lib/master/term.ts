
export interface GetTermData{
    term_id: string;
    term_name: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
}

export interface CreateTermData{
    term_name: string;
}

export interface UpdateTermData {
    term_id: string;
    term_name: string;
}

export async function getAllTerm(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetTermData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/term.php?page=${page}&limit=${limit}&params=${search}`, {
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

export async function getDetailTerm(term_id: string = '') : Promise<{ data: GetTermData[]; pagination: any }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/term.php?term_id=${term_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //jika statusnya bukan 200 balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch detail term');
    }
     
    //jika 200 balikkin data dan pagination
    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function createTerm(input: CreateTermData) : Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/term.php`, {
        method: 'POST',
       headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            term_name: input.term_name
        }),
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create term');
    }

    return json;
}

export async function updateTerm(input: UpdateTermData) : Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/term.php`, {
        method: 'PUT',
       headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            term_id: input.term_id,
            term_name: input.term_name
        }),
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update term');
    }

    return json;
}

export async function deleteTerm(term_id: string) : Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/term.php?term_id=${term_id}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //Jika tidak berhasil dengan status bukan 201 dan 200, balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || "Failed to delete term");
    }
    
    return json;
}