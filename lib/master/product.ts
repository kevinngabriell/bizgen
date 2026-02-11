export interface GetProductData{
    product_id: string;
    product_code: string;
    product_name: string;
    product_description: string;
    company_id: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
}

export interface CreateProductData{
    product_code: string;
    product_name: string;
    product_description?: string;
}

export interface UpdateProductData {
    product_id?: string;
    product_code?: string;
    product_name?: string;
    product_description?: string;
}

export async function getAllProduct(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetProductData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/product.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch product');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDetailProduct(product_id: string = '') : Promise<{ data: GetProductData[]; pagination: any }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/product.php?product_id=${product_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //jika statusnya bukan 200 balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch detail product');
    }
     
    //jika 200 balikkin data dan pagination
    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function createProduct(input: CreateProductData): Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/product.php`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_code: input.product_code,
            product_name: input.product_name,
            product_description: input.product_description
        })
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create product');
    }

    return json;
}

export async function updateProduct(input: UpdateProductData): Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/product.php`, {
        method: 'PUT',
       headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: input.product_id,
            product_code: input.product_code,
            product_name: input.product_name,
            product_description: input.product_description
        })
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update product');
    }

    return json;
}

export async function deleteProduct(product_id: string): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/product.php?product_id=${product_id}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //Jika tidak berhasil dengan status bukan 201 dan 200, balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || "Failed to delete product");
    }
    
    return json;
}