export interface GetSalesDeliveryNumber {
    number: string;
}

export async function generateSalesDeliveryNumber(): Promise<GetSalesDeliveryNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/generate-number.php?module_name=delivery_order`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch sales delivery number');
  }

  return json.data;
}