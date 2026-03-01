export interface GetQuotationNumber {
    number: string;
}

export async function generateQuotationNumber(): Promise<GetQuotationNumber>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/generate-number.php?module_name=quotation`, {
        method: 'GET',
        headers: {
        Authorization: `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch quotation number');
    }

    return json.data; // ⬅️ object { number: string }
}