export interface GetCompanyProfile {
  company_id: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  company_industry: string;
}

export async function getCompanyProfile(): Promise<GetCompanyProfile> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}account/company.php`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch company profile');
  }

  return json.data;
}
