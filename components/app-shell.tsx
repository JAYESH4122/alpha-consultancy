"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BriefcaseBusiness, Building2, CalendarDays, Check, ChevronDown, ClipboardCheck, ContactRound, FileClock, Gavel, LayoutDashboard, LogOut, Menu, RotateCcw, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import type { Role } from "@/lib/types";

const navByRole = {
  candidate: [
    { href: "/candidate", label: "Overview", icon: LayoutDashboard },
    { href: "/candidate/matches", label: "Job matches", icon: BriefcaseBusiness },
    { href: "/candidate/applications", label: "Applications", icon: ClipboardCheck },
    { href: "/candidate/profile", label: "My profile", icon: UserRound },
  ],
  employer: [
    { href: "/employer", label: "Overview", icon: LayoutDashboard },
    { href: "/employer/jobs", label: "Jobs", icon: BriefcaseBusiness },
    { href: "/employer/candidates", label: "Candidate pipeline", icon: ContactRound },
    { href: "/employer/organization", label: "Organization", icon: Building2 },
  ],
  admin: [
    { href: "/admin", label: "Operations", icon: LayoutDashboard },
    { href: "/admin/employers", label: "Employers", icon: Building2 },
    { href: "/admin/jobs", label: "Job approvals", icon: BriefcaseBusiness },
    { href: "/admin/candidates", label: "Candidates", icon: UsersRound },
    { href: "/admin/applications", label: "Screening", icon: ClipboardCheck },
    { href: "/admin/interviews", label: "Interviews", icon: CalendarDays },
    { href: "/admin/requests", label: "Privacy requests", icon: FileClock },
    { href: "/admin/legal", label: "Legal documents", icon: Gavel },
  ],
} as const;

export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, resetDemo, markNotificationRead, markAllNotificationsRead } = useDemo();
  const unread = notifications.filter((notification) => notification.role === role && !notification.read).length;
  const roleNotifications = notifications.filter((notification) => notification.role === role);
  const nav = navByRole[role];
  const roleLabel = role === "candidate" ? "Candidate" : role === "employer" ? "Employer" : "Admin operations";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <Link className="brand brand-inverse" href="/"><span className="brand-mark"><ShieldCheck size={19} /></span><span>Alpha Consultancy</span></Link>
          <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <div className="role-label"><span>{roleLabel}</span><ChevronDown size={15} /></div>
        <nav className="side-nav" aria-label={`${roleLabel} navigation`}>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== `/${role}` && pathname.startsWith(`${href}/`));
            return <Link key={href} href={href} className={active ? "active" : ""} onClick={() => setMobileOpen(false)}><Icon size={18} /><span>{label}</span></Link>;
          })}
        </nav>
        <div className="sidebar-footer">
          <button onClick={resetDemo}><RotateCcw size={17} /> Reset demo data</button>
          <Link href="/login"><LogOut size={17} /> Switch workspace</Link>
        </div>
      </aside>
      {mobileOpen ? <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" /> : null}
      <div className="app-main">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="topbar-context"><span>Privacy mode</span><strong><ShieldCheck size={15} /> Identity protected</strong></div>
          <div className="topbar-actions"><button className="notification-button" aria-label={`${unread} unread notifications`} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell size={19} />{unread > 0 ? <span>{unread}</span> : null}</button><div className="avatar">{role === "candidate" ? "AN" : role === "employer" ? "HF" : "PK"}</div></div>
        </header>
        {notificationsOpen ? <aside className="notification-drawer" aria-label="Notifications">
          <header><div><h2>Notifications</h2><p>{unread} unread update{unread === 1 ? "" : "s"}</p></div><button className="icon-button" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}><X size={18} /></button></header>
          {roleNotifications.length > 0 ? <><button className="mark-all-button" onClick={() => markAllNotificationsRead(role)}><Check size={14} /> Mark all as read</button><div className="notification-list">{roleNotifications.map((notification) => <button key={notification.id} className={notification.read ? "read" : ""} onClick={() => markNotificationRead(notification.id)}><span /><div><strong>{notification.title}</strong><p>{notification.body}</p><time>{new Date(notification.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time></div></button>)}</div></> : <div className="empty-state"><Bell size={26} /><h3>No notifications yet</h3></div>}
        </aside> : null}
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
