export interface CreateTaxData {
    tax_name: string;
    tax_rate: string;
    calculation_method: string;
    effective_from: string;
    effective_to: string;
}

export interface GetTaxData {
    tax_id: string;
    tax_name: string;
    tax_rate: string;
    calculation_method: string;
}

export async function getAllTax(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetTaxData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/tax.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch tax');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}