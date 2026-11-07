import { getSupabase } from "./supabase";

export type AdminBooking = {
  id: string;
  message_id: string | null;
  starts_at: string;
  ends_at: string;
  status: "requested" | "confirmed" | "blocked" | "cancelled";
  portfolio_messages: { name: string; email: string } | null;
};

export async function readBookings(history = false) {
  let query = getSupabase().from("portfolio_bookings")
    .select("id,message_id,starts_at,ends_at,status,portfolio_messages(name,email)")
    .order("starts_at", { ascending: !history }).limit(200);
  if (!history) query = query.neq("status", "cancelled").gte("ends_at", new Date().toISOString());
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as AdminBooking[];
}

export async function changeBooking(id: string, status: "confirmed" | "cancelled") {
  const { error } = await getSupabase().rpc("manage_portfolio_booking", { p_id: id, p_status: status }).retry(false);
  if (error) throw error;
}

export async function blockTime(date: string, time: string) {
  const { error } = await getSupabase().rpc("block_portfolio_time", { p_date: date, p_time: time }).retry(false);
  if (error) {
    if (error.code === "23P01") throw new Error("This time overlaps an existing reservation. Refresh and choose another time.");
    throw error;
  }
}
