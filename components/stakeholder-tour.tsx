"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  FileText,
  Handshake,
  LockKeyhole,
  MapPin,
  Menu,
  Play,
  Search,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { tourRoles, tourStages, type TourRole } from "@/lib/stakeholder-tour";

const stageIcons = [FileText, ShieldCheck, UserRoundCheck, Search, Handshake];
const roleIcons = { employer: Building2, admin: ShieldCheck, candidate: UserRound };

export function StakeholderTour() {
  const [activeIndex, setActiveIndex] = useState(3);
  const [activeRole, setActiveRole] = useState<TourRole>("admin");
  const [menuOpen, setMenuOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const stage = tourStages[activeIndex];

  const selectStage = (index: number) => {
    setActiveIndex(index);
    setActiveRole(tourStages[index].actor);
    setCompleted(false);
  };

  const startWalkthrough = () => {
    selectStage(0);
    document.getElementById("guided-journey")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const move = (direction: -1 | 1) => {
    const nextIndex = activeIndex + direction;
    if (nextIndex < 0) return;
    if (nextIndex >= tourStages.length) {
      setCompleted(true);
      return;
    }
    selectStage(nextIndex);
  };

  return (
    <main className="tour-page">
      <header className="tour-header">
        <div className="tour-header-inner">
          <Link className="brand" href="/" aria-label="Alpha Consultancy home">
            <span className="brand-mark"><ShieldCheck size={20} /></span>
            <span>Alpha Consultancy</span>
          </Link>
          <nav className={menuOpen ? "tour-nav tour-nav-open" : "tour-nav"} aria-label="Product tour navigation">
            <a href="#guided-journey" onClick={() => setMenuOpen(false)}>Product tour</a>
            <Link href="/login" onClick={() => setMenuOpen(false)}>Role workspaces</Link>
          </nav>
          <Link className="button button-dark button-small tour-open-workspaces" href="/login">Open workspaces <ArrowRight size={16} /></Link>
          <button className="icon-button tour-menu-button" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={20} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <section className="tour-intro tour-width">
        <div>
          <h1>See one hiring journey from request to interview.</h1>
          <p><span className="tour-copy-desktop">Follow a sample warehouse role through every privacy checkpoint. Switch perspectives to see what each person can view and do.</span><span className="tour-copy-mobile">Follow a sample role through every privacy checkpoint.</span></p>
        </div>
        <div className="tour-intro-actions">
          <button className="button button-primary" type="button" onClick={startWalkthrough}><Play size={17} fill="currentColor" /> Start guided walkthrough</button>
          <Link className="button button-secondary" href="/login"><Compass size={17} /> Explore freely</Link>
        </div>
      </section>

      <section className="tour-workflow tour-width" id="guided-journey" aria-label="Guided recruitment journey">
        <div className="tour-progress" aria-label={`Step ${stage.number} of ${tourStages.length}`}>
          {tourStages.map((item, index) => {
            const Icon = stageIcons[index];
            const selected = index === activeIndex;
            const complete = index < activeIndex;
            return (
              <button key={item.number} type="button" className={selected ? "tour-step tour-step-active" : complete ? "tour-step tour-step-complete" : "tour-step"} aria-current={selected ? "step" : undefined} onClick={() => selectStage(index)}>
                <span className="tour-step-number">{item.number}</span>
                <Icon size={20} />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="tour-mobile-stage-label" aria-live="polite">
          <strong>{stage.shortLabel}</strong>
          <span>Step {stage.number} of {tourStages.length}</span>
        </div>

        <div className="tour-canvas">
          <aside className="tour-role-lanes" aria-label="View the current step by role">
            <div className="tour-role-selector" role="tablist" aria-label="Role perspective">
              {tourRoles.map((role) => {
                const Icon = roleIcons[role.key];
                const selected = role.key === activeRole;
                return (
                  <button key={role.key} type="button" role="tab" aria-selected={selected} className={selected ? "tour-role tour-role-active" : "tour-role"} onClick={() => setActiveRole(role.key)}>
                    <Icon size={23} />
                    <span><strong>{role.label}</strong><small>{role.description}</small></span>
                  </button>
                );
              })}
            </div>
            <div className="tour-perspective" role="tabpanel" aria-live="polite">
              <span>At this step</span>
              <p>{stage.actions[activeRole]}</p>
            </div>
          </aside>

          <article className="tour-stage-panel" aria-live="polite">
            <header>
              <span className="tour-reference">{stage.reference}</span>
              <div>
                <h2>{stage.roleTitle}</h2>
                <p><MapPin size={16} /> {stage.location}</p>
              </div>
            </header>
            <div className="tour-stage-copy">
              <span>Stage {stage.number}</span>
              <h3>{stage.title}</h3>
              <p>{stage.summary}</p>
            </div>
            <div className="tour-checks">
              <h4>{stage.number === 4 ? "Screening checks" : "Checkpoint status"}</h4>
              {stage.checks.map((check) => <div key={check}><CheckCircle2 size={20} /><span>{check}</span></div>)}
            </div>
            <div className="tour-next-action">
              <span><ArrowRight size={22} /></span>
              <div><strong>Next: {stage.nextAction}</strong><p>{stage.nextDescription}</p></div>
            </div>
            <Link className="tour-workspace-link" href={stage.workspaceHref}>{stage.workspaceLabel} <ArrowRight size={15} /></Link>
          </article>

          <aside className="tour-visibility" aria-label="Visibility at this stage">
            <header><LockKeyhole size={25} /><h2>Who can see what?</h2></header>
            <div className="tour-visibility-list">
              {tourRoles.map((role) => {
                const Icon = roleIcons[role.key];
                return <div key={role.key} className={role.key === activeRole ? "visibility-row visibility-row-active" : "visibility-row"}><span><Icon size={20} /></span><p><strong>{role.label}</strong>{stage.visibility[role.key]}</p></div>;
              })}
            </div>
            <div className="tour-lock-line"><LockKeyhole size={18} /><span>{stage.number < 5 ? "Identities stay hidden until the handoff gate." : "Identity release is limited to this approved interview."}</span></div>
          </aside>
        </div>

        {completed ? <div className="tour-complete" role="status"><CheckCircle2 size={20} /><div><strong>Walkthrough complete</strong><p>You have followed the full controlled journey. Open any workspace to explore the working screens.</p></div><Link className="button button-dark button-small" href="/login">Explore workspaces <ArrowRight size={15} /></Link></div> : null}

        <footer className="tour-controls">
          <button className="button button-secondary" type="button" disabled={activeIndex === 0} onClick={() => move(-1)}><ArrowLeft size={17} /> Previous</button>
          <span>Step {stage.number} of {tourStages.length}</span>
          <button className="button button-primary" type="button" onClick={() => move(1)}>{activeIndex === tourStages.length - 1 ? "Finish tour" : "Next step"} <ArrowRight size={17} /></button>
        </footer>
      </section>
    </main>
  );
}
