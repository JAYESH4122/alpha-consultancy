import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type DeliveryRow = {
  id: string;
  idempotency_key: string;
  attempt_count: number;
  notification: {
    title: string;
    body: string;
    profile: { email: string | null } | null;
  } | null;
};

export async function POST(request: Request) {
  const secret = process.env.NOTIFICATION_WORKER_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!supabaseUrl || !serviceRoleKey || !resendKey || !from) {
    return NextResponse.json({ error: "Notification provider is not configured" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase
    .from("notification_deliveries")
    .select("id, idempotency_key, attempt_count, notification:notifications(title, body, profile:profiles(email))")
    .eq("channel", "email")
    .in("status", ["queued", "failed", "retried"])
    .order("updated_at", { ascending: true })
    .limit(25);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const deliveries = (data ?? []) as unknown as DeliveryRow[];
  const results = [];

  for (const delivery of deliveries) {
    const email = delivery.notification?.profile?.email;
    if (!email || !delivery.notification) {
      await supabase.from("notification_deliveries").update({ status: "failed", attempt_count: delivery.attempt_count + 1, last_error: "Recipient email missing", updated_at: new Date().toISOString() }).eq("id", delivery.id);
      results.push({ id: delivery.id, status: "failed" });
      continue;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json", "Idempotency-Key": delivery.idempotency_key },
        body: JSON.stringify({ from, to: [email], subject: delivery.notification.title, text: delivery.notification.body }),
      });
      const payload = await response.json() as { id?: string; message?: string };
      if (!response.ok) throw new Error(payload.message ?? `Resend returned ${response.status}`);
      await supabase.from("notification_deliveries").update({ status: "sent", provider_message_id: payload.id, attempt_count: delivery.attempt_count + 1, last_error: null, updated_at: new Date().toISOString() }).eq("id", delivery.id);
      results.push({ id: delivery.id, status: "sent" });
    } catch (sendError) {
      await supabase.from("notification_deliveries").update({ status: delivery.attempt_count >= 4 ? "failed" : "retried", attempt_count: delivery.attempt_count + 1, last_error: sendError instanceof Error ? sendError.message : "Unknown email error", updated_at: new Date().toISOString() }).eq("id", delivery.id);
      results.push({ id: delivery.id, status: "retried" });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
