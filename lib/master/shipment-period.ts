export interface GetShipmentPeriodData{
    shipment_period_id: string;
    shipment_period_name: string;
    shipment_date_range_start: string;
    shipment_date_range_end: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
}

export interface CreateShipmentPeriodData {
    shipment_period_name: string;
    shipment_date_range_start: string; // 'YYYY-MM-DD'
    shipment_date_range_end: string;   // 'YYYY-MM-DD'
}

export async function getAllShipmentPeriod(page: number = 1, limit = 10, search: string = '') : Promise<{data: GetShipmentPeriodData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/shipment-period.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch shipment period');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function createShipmentPeriod(input: CreateShipmentPeriodData): Promise<any>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const formData = new FormData();

    formData.append('shipment_period_name', String(input.shipment_period_name));
    formData.append('shipment_date_range_start', String(input.shipment_date_range_start));
    formData.append('shipment_date_range_end', String(input.shipment_date_range_end));

    const res = await fetch(`${baseUrl}master/shipment-period.php`, {
        method: 'POST',
       headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create shipment period');
    }

    return json;
}

export async function updateShipmentPeriod(){

}

export async function deleteShipmentPeriod(shipment_period_id: string) :  Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}master/shipment-period.php?shipment_period_id=${shipment_period_id}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    const json = await res.json();

    //Jika tidak berhasil dengan status bukan 201 dan 200, balikkin error
    if (json.status_code !== 200) {
        throw new Error(json.status_message || "Failed to delete shipment period");
    }
    
    return json;
}