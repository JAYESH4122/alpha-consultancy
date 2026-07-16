import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, UserRound, UserRoundCog } from "lucide-react";
import { PhoneAuth } from "@/components/phone-auth";
import { AdminAuth } from "@/components/admin-auth";

const roles = [
  { href: "/candidate", icon: UserRound, title: "Candidate", text: "Discover private job matches and manage your applications." },
  { href: "/employer", icon: Building2, title: "Employer", text: "Post requirements and follow your verified hiring pipeline." },
  { href: "/admin", icon: UserRoundCog, title: "Admin", text: "Review jobs, screen candidates, and control handoffs." },
];

export default function LoginPage() {
  return (
    <main className="login-page">
      <Link className="brand" href="/"><span className="brand-mark"><ShieldCheck size={20} /></span><span>Alpha Consultancy</span></Link>
      <section className="login-panel">
        <PhoneAuth />
        <AdminAuth />
        <div className="login-intro"><h1>Choose a workspace</h1><p>This interactive demo keeps data in your browser. Connect Supabase credentials to activate secure phone OTP and production data.</p></div>
        <div className="role-options">
          {roles.map(({ href, icon: Icon, title, text }) => (
            <Link href={href} key={href} className="role-option">
              <span><Icon size={22} /></span><div><h2>{title}</h2><p>{text}</p></div><ArrowRight size={19} />
            </Link>
          ))}
        </div>
        <div className="secure-note"><ShieldCheck size={17} /> Production access is protected with role permissions and database-level policies.</div>
      </section>
    </main>
  );
}
