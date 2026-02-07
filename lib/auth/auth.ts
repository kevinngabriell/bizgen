import { jwtDecode } from 'jwt-decode'; 

interface JwtPayload {
  exp: number;
}

export interface DecodedAuthToken {
  iat: number;
  exp: number;
  user_id: string;
  username: string;
  company_id: string;
  app_id: string;
  app_role_id: string;
  days_remaining: number;
}

export async function login(username: string, password: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
        const res = await fetch(`${baseUrl}`+`/account/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
            }),
        });

        const data = await res.json();

        if (!res.ok || data.status_code !== 200) {
            throw new Error(data.status_message || "Login failed");
        }

        return data; // Biasanya data.token atau data.jwt, tergantung struktur response kamu
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.log('error : ', error);
    return true; // Consider invalid token as expired
  }
}


export async function checkAuthOrRedirect(): Promise<boolean> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");

    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token");
      window.location.href = "/";
      return false;
    }

    return true;
  }

  return false;
}

export function getAuthInfo(): DecodedAuthToken {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Auth token not found");
  }

  try {
    const decoded = jwtDecode<DecodedAuthToken>(token);

    // pastikan username tidak kosong
    if (!decoded.username) {
      throw new Error("username is missing in token");
    }

    return decoded;
  } catch (error) {
    console.error("Failed to decode token:", error);
    throw error;
  }
}