export interface GetListMyWarehouseData{
    warehouse_id: string;
    warehouse_name: string;
    location: string;
    is_default: string;
}

export async function getAllListMyWarehouse(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetListMyWarehouseData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}warehouse/warehouse.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch warehouse');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}