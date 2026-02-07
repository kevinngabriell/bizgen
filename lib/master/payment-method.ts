export interface GetPaymentMethodData{
    payment_id: string;
    payment_name: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
}

export interface CreatePaymentMethodData{
    payment_name: string;
}

export async function getAllPaymentMethod(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetPaymentMethodData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/payment-method.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch payment method');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}


export async function getDetailPaymentMethod(payment_id: string = '') : Promise<{ data: GetPaymentMethodData[]; pagination: any }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/payment-method.php?payment_id=${payment_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //jika statusnya bukan 200 balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch detail payment method');
    }
     
    //jika 200 balikkin data dan pagination
    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function createPaymentMethod(input: CreatePaymentMethodData) : Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const formData = new FormData();

    formData.append('payment_name', String(input.payment_name));

    const res = await fetch(`${baseUrl}master/payment-method.php`, {
        method: 'POST',
        headers: {
                Authorization: `Bearer ${token}`,
            },
        body: formData,
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create payment method');
    }

    return json;
}

export async function updatePaymentMethod(){

}

export async function deletePaymentMethod(payment_id: string){
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/payment-method.php?payment_id=${payment_id}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //Jika tidak berhasil dengan status bukan 201 dan 200, balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || "Failed to delete payment method");
    }
    
    return json;
}