export interface BizgenListServiceData{
    service_id: string;
    service_name: string;
    service_description: string;
    service_price: string;
    billing_cycle: string;
}

export async function getAllBizgenListService(app_id: string = '') : Promise<{data: BizgenListServiceData[]; pagination: any}>{
    const baseUrl = 'https://getmovira.com/api/';

    const res = await fetch(`${baseUrl}movira/app/services.php?app_id=${app_id}`, {
        method: 'GET'
    });

     const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch services');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}