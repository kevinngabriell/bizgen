export interface GetCostingCategoryData{
    costing_category_id: string;
    costing_category_name: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
}

export async function getAllCostingCategory(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetCostingCategoryData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/costing-category.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch costing category');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}
