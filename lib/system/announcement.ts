export interface Announcement {
  announcement_id: string;
  title: string;
  message: string;
  type: "maintenance" | "update" | "announcement" | "promo";
  show_from: string | null;
  show_until: string | null;
  is_force_popup: string | number;
}

export interface AnnouncementDetail extends Announcement {
  is_active: string | number;
  created_by: string;
  created_at: string;
}

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseUrl}systems/system-notification.php?active=true`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (json.status_code === 404) return [];

  if (json.status_code !== 200) {
    throw new Error(json.status_message || "Failed to fetch announcements");
  }

  return json.data?.data ?? [];
}

export async function getAllAnnouncements(
  page: number = 1,
  limit: number = 10,
  search: string = ""
): Promise<{ data: AnnouncementDetail[]; pagination: any }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${baseUrl}systems/system-notification.php?page=${page}&limit=${limit}&params=${search}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const json = await res.json();

  if (json.status_code !== 200) {
    throw new Error(json.status_message || "Failed to fetch announcements");
  }

  return {
    data: json.data?.data ?? [],
    pagination: json.data?.pagination ?? {},
  };
}
