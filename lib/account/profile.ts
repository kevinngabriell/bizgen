export interface UpdateProfileData {
  username: string;
  phone_number: string;
  language: string;
  current_password?: string;
  new_password?: string;
}

export async function updateProfile(input: UpdateProfileData): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}account/profile.php`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (json.status_code !== 200 && json.status_code !== 201) {
    throw new Error(json.status_message || "Failed to update profile");
  }

  // If API returns a new token (e.g. language or username changed), update it
  if (json.data?.token) {
    localStorage.setItem("token", json.data.token);
  }

  return json;
}
