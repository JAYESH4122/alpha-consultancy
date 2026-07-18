import { AppShell } from "@/components/app-shell";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="candidate">{children}</AppShell>;
}
