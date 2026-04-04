export interface GetSalesDocumentNumber {
  number: string;
}

export interface CreateSalesDocumentMilestones {
  type: string;
  date: string;
  note: string;
}

export interface CreateSalesDocumentData { 
  shipment_no: string;
  job_order_id: string;
  ship_via_id: string;
  term_id: string;
  origin_port: string;
  destination_port: string;
  etd: string;
  eta: string;
  container_information: string;
  operational_notes: string;
  milestones: CreateSalesDocumentMilestones[];
}

export interface GetSalesDocumentItemData {
  shipment_id: string;
  shipment_no: string;
  created_at: string;
}

export async function generateSalesDocumentNumber(): Promise<GetSalesDocumentNumber> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/generate-number.php?module_name=document`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch sales document number');
  }

  return json.data;
}

export async function createSalesDocument(input: CreateSalesDocumentData) : Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/shipments.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shipment_no: input.shipment_no,
      job_order_id: input.job_order_id,
      ship_via_id: input.ship_via_id,
      term_id: input.term_id,
      origin_port: input.origin_port,
      destination_port: input.destination_port,
      etd: input.etd,
      eta: input.eta,
      container_information: input.container_information,
      operational_notes: input.operational_notes,
      milestones: input.milestones
    })
  });

  const json = await res.json();

  //Jika statusnya bukan 201 atau 200 maka error 
  if (json.status_code !== 201 && json.status_code !== 200) {
      throw new Error(json.status_message || 'Failed to create sales documents');
  }

  return json;
}

export interface GetDetailShipmentHeader {
  shipment_id: string;
  shipment_no: string;
  ship_via_name: string;
  term_name: string;
  job_order_no: string;
  status?: string;
}

export interface GetDetailShipmentRoute {
  route_id: string;
  origin_port_name: string;
  destination_port_name: string;
  etd: string;
  eta: string;
  container_information: string;
  operational_notes: string;
}

export interface GetDetailShipmentMilestone {
  milestone_id: string;
  milestone_type: string;
  milestone_date: string;
  notes: string;
}

export interface GetDetailShipmentHistory {
  action: string;
  action_by: string;
  notes: string;
  created_at: string;
}

export interface GetDetailShipmentResponse {
  header: GetDetailShipmentHeader;
  routes: GetDetailShipmentRoute[];
  milestones: GetDetailShipmentMilestone[];
  history: GetDetailShipmentHistory[];
}

export interface UpdateShipmentData {
  shipment_id: string;
  ship_via_id?: string;
  term_id?: string;
}

export interface ProcessShipmentActionData {
  shipment_id: string;
  action: 'submit' | 'approve' | 'reject';
  notes?: string;
}

export async function getDetailSalesDocument(shipment_id: string): Promise<GetDetailShipmentResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/shipments.php?shipment_id=${shipment_id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to fetch shipment detail');
  }

  return json.data;
}

export async function updateSalesDocument(input: UpdateShipmentData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/shipments.php`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to update shipment');
  }

  return json;
}

export async function processShipmentAction(input: ProcessShipmentActionData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/shipments.php?action=${input.action}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to process shipment action');
  }

  return json;
}

export async function deleteSalesDocument(shipment_id: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}sales/shipments.php?shipment_id=${shipment_id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || 'Failed to delete shipment');
  }

  return json;
}

export async function getSalesDocument(page: number = 1, limit : number = 10, search: string = ''): Promise<{data: GetSalesDocumentItemData[]; pagination: any}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}sales/shipments.php?page=${page}&limit=${limit}&params=${search}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch sales shipments');
    }

    return {
        data: json.data?.data || [],
        pagination: json.data?.pagination || {}
    };
}