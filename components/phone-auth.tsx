"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function PhoneAuth() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [role, setRole] = useState<"candidate" | "employer">("candidate");
  const [phase, setPhase] = useState<"phone" | "verify">("phone");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!isSupabaseConfigured()) return null;

  const sendOtp = async () => {
    setPending(true); setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone, options: { data: { role } } });
    setPending(false);
    if (error) { setMessage(error.message); return; }
    setPhase("verify"); setMessage("A 6-digit verification code was sent to your phone.");
  };

  const verifyOtp = async () => {
    setPending(true); setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    setPending(false);
    if (error) { setMessage(error.message); return; }
    router.push(`/${role}`); router.refresh();
  };

  return <section className="production-auth">
    <div><Smartphone size={20} /><h2>Secure phone sign-in</h2></div>
    <p>Use your verified mobile number to access production data.</p>
    {phase === "phone" ? <div className="auth-fields"><label>Account type<select value={role} onChange={(event) => setRole(event.target.value as "candidate" | "employer")}><option value="candidate">Candidate</option><option value="employer">Employer</option></select></label><label>Mobile number<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" inputMode="tel" /></label><button className="button button-primary" type="button" disabled={pending || phone.length < 10} onClick={sendOtp}>{pending ? "Sending…" : "Send OTP"}</button></div> : <div className="auth-fields"><label>Verification code<input value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="6-digit code" /></label><button className="button button-primary" type="button" disabled={pending || token.length !== 6} onClick={verifyOtp}>{pending ? "Checking…" : "Verify & continue"}</button></div>}
    {message ? <small role="status">{message}</small> : null}
  </section>;
}
