export interface RegisterAsNewBusinessData {
    username: string;
    password: string;
    whatsapp_number: string;
    business_name: string;
    package: string;
}

export interface getPaymentInformationData{
    expected_amount: number;
    bank: bankInformationPaymentData;
    expired_at: string;
}

export interface bankInformationPaymentData{
    name: string;
    account_number: string;
    account_name: string;
}

export interface ConfirmPaymentData{
    payment_id: string;
    confirm_paid: string;
    image?: File | Blob | null; 
}

export interface RegisterAsNewEmployeeData {
    username: string;
    password: string;
    whatsapp_number: string;
    company_code: string;
}

export async function RegisterAsNewEmployee(input: RegisterAsNewEmployeeData) : Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    const res = await fetch(`${baseUrl}account/register/join-company.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: input.username,
            password: input.password,
            whatsapp_number: input.whatsapp_number,
            company_code: input.company_code
        })
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to join as employee');
    }

    return json;
}

export async function RegisterAsNewBusiness(input: RegisterAsNewBusinessData) : Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    const res = await fetch(`${baseUrl}account/register/new-company.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: input.username,
            password: input.password,
            whatsapp_number: input.whatsapp_number,
            business_name: input.business_name,
            package: input.package
        })
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create a new company');
    }

    return json;
}