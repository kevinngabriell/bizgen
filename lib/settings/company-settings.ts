export interface GetCompanySettingsData {
    id: string;
    company_id: string;
    invoice_under: string | null;
    should_mention_name: string | null;
    shipping_marks: string | null;
    default_delivery_address_id: string | null;
    created_at: string;
}

export interface CreateCompanySettingsData {
    invoice_under?: string;
    should_mention_name?: string;
    shipping_marks?: string;
    default_delivery_address_id?: string;
}

export interface UpdateCompanySettingsData {
    id: string;
    invoice_under?: string | null;
    should_mention_name?: string | null;
    shipping_marks?: string | null;
    default_delivery_address_id?: string | null;
}

export async function getAllCompanySettings(page: number = 1, limit = 10): Promise<{ data: GetCompanySettingsData[]; pagination: any }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}settings/company-settings.php?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch company settings');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function getDetailCompanySettings(id: string): Promise<{ data: GetCompanySettingsData[]; pagination: any }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}settings/company-settings.php?id=${id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch detail company settings');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}

export async function createCompanySettings(input: CreateCompanySettingsData): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}settings/company-settings.php`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            invoice_under: input.invoice_under,
            should_mention_name: input.should_mention_name,
            shipping_marks: input.shipping_marks,
            default_delivery_address_id: input.default_delivery_address_id,
        }),
    });

    const json = await res.json();

    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create company settings');
    }

    return json;
}

export async function updateCompanySettings(input: UpdateCompanySettingsData): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}settings/company-settings.php`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: input.id,
            invoice_under: input.invoice_under,
            should_mention_name: input.should_mention_name,
            shipping_marks: input.shipping_marks,
            default_delivery_address_id: input.default_delivery_address_id,
        }),
    });

    const json = await res.json();

    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to update company settings');
    }

    return json;
}

export async function deleteCompanySettings(id: string): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}settings/company-settings.php?id=${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to delete company settings');
    }

    return json;
}
