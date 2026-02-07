export interface ResetPasswordPayload {
    username?: string;
    phone_number?: string;
}

export interface VerifyOTPResetPasswordPayload {
    user_id: string;
    phone_number: string;
    otp_code: string;
    new_password: string;
}

export async function createOTPForgotPassword(input: ResetPasswordPayload) : Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    const res = await fetch(`${baseUrl}account/reset-password.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: input.username || null,
            phone_number: input.phone_number || null
        }),
    });

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create OTP');
    }

    return json;
}