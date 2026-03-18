export interface GetPurchaseQuotationNumber {
    number: string;
}

export async function generatePurchaseQuotationNumber(): Promise<GetPurchaseQuotationNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}purchase/generate-number.php?module_name=quotation`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase quotation number');
  }

  return json.data;
}