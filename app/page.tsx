import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, UserRoundSearch } from "lucide-react";

const steps = [
  { number: "01", title: "Employers share the requirement", text: "Structured job details come to our team first for verification and approval." },
  { number: "02", title: "Employees receive private matches", text: "Relevant employees see jobs with company details hidden and decide whether to show interest." },
  { number: "03", title: "We screen and arrange the interview", text: "Identity and contact details are shared only after consent and admin approval." },
];

export default function Home() {
  return (
    <main className="marketing-page">
      <header className="marketing-nav shell-width">
        <Link className="brand" href="/" aria-label="Alpha Consultancy home">
          <span className="brand-mark"><ShieldCheck size={20} /></span>
          <span>Alpha Consultancy</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/tour">Product tour</Link>
          <a href="#how-it-works">How it works</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <Link className="button button-dark button-small" href="/login">Open workspace <ArrowRight size={16} /></Link>
      </header>

      <section className="hero shell-width">
        <div className="hero-copy">
          <h1>Recruitment with a trusted human in the middle.</h1>
          <p>Employers find verified people. Employees find legitimate work. Alpha Consultancy protects both sides until an interview is ready.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/tour">See the guided tour <ArrowRight size={18} /></Link>
            <Link className="text-link" href="/login">Open role workspaces</Link>
          </div>
          <div className="trust-line"><ShieldCheck size={17} /> No direct contact before an admin-approved interview</div>
        </div>
        <div className="hero-workflow" aria-label="Recruitment workflow preview">
          <div className="workflow-topline">
            <span>Controlled recruitment</span>
            <span className="live-dot">Admin verified</span>
          </div>
          <div className="workflow-party">
            <span className="workflow-icon employer"><Building2 size={20} /></span>
            <div><strong>Employer requirement</strong><small>Company identity protected</small></div>
            <span className="status status-review">Under review</span>
          </div>
          <div className="workflow-rail"><span /><b>Alpha Consultancy review</b><span /></div>
          <div className="workflow-party">
            <span className="workflow-icon candidate"><UserRoundSearch size={20} /></span>
            <div><strong>Employee match</strong><small>Profile shared with consent</small></div>
            <span className="status status-approved">92% match</span>
          </div>
          <div className="handoff-box"><ShieldCheck size={22} /><div><strong>Interview connection</strong><small>Details are shared only after both sides agree</small></div></div>
        </div>
      </section>

      <section className="process-section" id="how-it-works">
        <div className="shell-width">
          <div className="section-heading"><h2>One careful process. Clear at every step.</h2><p>Every action is recorded, every identity stays controlled, and both parties always know what happens next.</p></div>
          <div className="steps-list">{steps.map((step) => <article key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
        </div>
      </section>

      <section className="privacy-section shell-width" id="privacy">
        <div><ShieldCheck size={28} /><h2>Built around privacy, not added later.</h2></div>
        <p>Employers never browse employee identities. Employees never see employer identity, exact worksite, or contact details before clearance. The admin team controls every release and leaves a complete audit trail.</p>
        <Link className="button button-light" href="/tour">Follow the full journey <ArrowRight size={17} /></Link>
      </section>
      <footer className="marketing-footer shell-width"><span>© 2026 Alpha Consultancy</span><span>Privacy-first recruitment operations</span></footer>
    </main>
  );
}
