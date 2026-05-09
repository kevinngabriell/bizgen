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

    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create OTP');
    }

    return json;
}

export async function changePasswordForgotPassword(input: VerifyOTPResetPasswordPayload): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    const res = await fetch(`${baseUrl}account/reset-password.php`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: input.user_id,
            phone_number: input.phone_number,
            otp_code: input.otp_code,
            new_password: input.new_password,
        }),
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to reset password');
    }

    return json;
}