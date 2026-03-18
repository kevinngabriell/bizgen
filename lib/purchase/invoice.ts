export interface GetPurchaseInvoiceNumber {
    number: string;
}

export async function generatePurchaseInvoiceNumber(): Promise<GetPurchaseInvoiceNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}purchase/generate-number.php?module_name=invoice`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch purchase invoice number');
  }

  return json.data;
}