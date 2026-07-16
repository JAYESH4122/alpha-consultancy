import { AppShell } from "@/components/app-shell";

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="employer">{children}</AppShell>;
}
