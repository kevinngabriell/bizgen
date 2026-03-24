export interface GetSalesBookingNumber {
    number: string;
}

export interface CreateSalesBookingData {
  job_order_number: string;
  job_type: string;
  ship_via_id: string;
  estimated_departure: string;
  estimated_arrival : string;
  shipper_company: string;
  shipper_contact: string;
  shipper_address: string;
  consignee_company : string;
  consignee_contact: string;
  consignee_address: string;
  origin_port: string;
  destination_port : string;
  incoterm: string;
  package_type: string;
  total_packages: string;
  gross_weight: string;
  cbm: string;
  freight_charge: string;
  local_charge: string;
  other_charge: string;
  remarks: string;
  inquiry_id: string;
}

export interface GetSalesBookingData {
  job_order_id: string;
  job_order_no: string;
  created_at: string;
}

export async function generateSalesBookingNumber(): Promise<GetSalesBookingNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/generate-number.php?module_name=booking_confirmation`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch sales booking number');
  }

  return json.data;
}

export async function createSalesJobOrder(input: CreateSalesBookingData) : Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/job-order.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      job_order_number: input.job_order_number,
      job_type: input.job_type,
      ship_via_id: input.ship_via_id,
      estimated_departure: input.estimated_departure,
      estimated_arrival : input.estimated_arrival,
      shipper_company: input.shipper_company,
      shipper_contact: input.shipper_contact,
      shipper_address: input.shipper_address,
      consignee_company : input.consignee_company,
      consignee_contact: input.consignee_contact,
      consignee_address: input.consignee_address,
      origin_port: input.origin_port,
      destination_port : input.destination_port,
      incoterm: input.incoterm,
      package_type: input.package_type,
      total_packages: input.total_packages,
      gross_weight: input.gross_weight,
      cbm: input.cbm,
      freight_charge: input.freight_charge,
      local_charge: input.local_charge,
      other_charge: input.other_charge,
      inquiry_id: input.inquiry_id,
      remarks: input.remarks
    })
  });

  const json = await res.json();

  //Jika statusnya bukan 201 atau 200 maka error 
  if (json.status_code !== 201 && json.status_code !== 200) {
      throw new Error(json.status_message || 'Failed to create sales job order');
  }

  return json;
}

export async function getSalesJobOrder(page: number = 1, limit : number = 10, search: string = ''): Promise<{data: GetSalesBookingData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/job-order.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch job order');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}