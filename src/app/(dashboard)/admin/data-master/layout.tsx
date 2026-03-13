"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { name: "Tahun Ajaran", href: "/admin/data-master/tahun-ajaran" },
  { name: "Kelas", href: "/admin/data-master/kelas" },
  { name: "Mata Pelajaran", href: "/admin/data-master/mapel" },
  { name: "Pengguna", href: "/admin/data-master/pengguna" },
  { name: "Ruang Ujian", href: "/admin/data-master/ruangan" },
];

export default function DataMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-foreground">Data Master</h1>
        <p className="text-muted-foreground">Kelola entitas utama yang mendasari sistem Rovedu CBT.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                  }
                `}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
