"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type User = { id: number; name: string; email: string };

export default function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-72">
        <Header user={user} onMenu={() => setOpen(true)} />
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}