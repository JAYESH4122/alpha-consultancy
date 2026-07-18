import Link from "next/link";
import { ArrowRight, Building2, Route, ShieldCheck, UserRound, UserRoundCog } from "lucide-react";
import { PhoneAuth } from "@/components/phone-auth";
import { AdminAuth } from "@/components/admin-auth";

const roles = [
  { href: "/employee", icon: UserRound, title: "Employee", text: "Discover private job matches and manage your applications." },
  { href: "/employer", icon: Building2, title: "Employer", text: "Post jobs and follow every approved application." },
  { href: "/admin", icon: UserRoundCog, title: "Admin", text: "Verify employers, approve jobs, and manage interviews." },
];

export default function LoginPage() {
  return (
    <main className="login-page">
      <Link className="brand" href="/"><span className="brand-mark"><ShieldCheck size={20} /></span><span>Alpha Consultancy</span></Link>
      <section className="login-panel">
        <PhoneAuth />
        <AdminAuth />
        <div className="login-intro"><h1>Choose a workspace</h1><p>Explore the same recruitment journey from each role. Demo changes stay in this browser and are shared across all three views.</p></div>
        <Link className="login-tour-link" href="/tour"><Route size={19} /><div><strong>New to the flow?</strong><span>Follow the guided employer-to-interview walkthrough first.</span></div><ArrowRight size={17} /></Link>
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
