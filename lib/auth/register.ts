export interface createNewCompanyData{
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
