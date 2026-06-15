import type { ReactNode } from "react";

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full">
      <main className="flex-1 lg:pl-60" id="main-content">
        {children}
      </main>
    </div>
  );
}
