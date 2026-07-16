"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AdminAuth() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [phase, setPhase] = useState<"credentials" | "mfa">("credentials");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!isSupabaseConfigured()) return null;

  const signIn = async () => {
    setPending(true); setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setPending(false); setMessage(error.message); return; }

    const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp.find((item) => item.status === "verified");
    if (factorError || !factor) {
      await supabase.auth.signOut();
      setPending(false);
      setMessage("A verified TOTP authenticator is required for admin access. Ask the system owner to enroll this admin account.");
      return;
    }
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
    setPending(false);
    if (challengeError || !challenge) { setMessage(challengeError?.message ?? "Could not start MFA verification."); return; }
    setFactorId(factor.id); setChallengeId(challenge.id); setPhase("mfa");
  };

  const verifyMfa = async () => {
    setPending(true); setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    setPending(false);
    if (error) { setMessage(error.message); return; }
    router.push("/admin"); router.refresh();
  };

  return <section className="production-auth admin-auth">
    <div>{phase === "credentials" ? <Mail size={20} /> : <KeyRound size={20} />}<h2>{phase === "credentials" ? "Admin email sign-in" : "Admin MFA verification"}</h2></div>
    <p>{phase === "credentials" ? "Provisioned admins use email credentials and a verified authenticator." : "Enter the 6-digit code from the enrolled authenticator app."}</p>
    {phase === "credentials" ? <div className="auth-fields admin-auth-fields"><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label><button className="button button-primary" type="button" disabled={pending || !email || password.length < 8} onClick={signIn}>{pending ? "Checking…" : "Continue"}</button></div> : <div className="auth-fields"><label>Authenticator code<input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" /></label><button className="button button-primary" type="button" disabled={pending || code.length !== 6} onClick={verifyMfa}>{pending ? "Verifying…" : "Verify & continue"}</button></div>}
    {message ? <small role="status">{message}</small> : null}
  </section>;
}
