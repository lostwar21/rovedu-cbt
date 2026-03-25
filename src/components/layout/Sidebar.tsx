"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/logout";
import {
    Home,
    Users,
    BookOpen,
    Settings,
    LogOut,
    Menu,
    X,
    ClipboardList,
    FileText,
    Activity,
    Printer
} from "lucide-react";

// Role-based Navigation Menus
const MENUS = {
    ADMIN: [
        { name: "Dashboard", href: "/admin", icon: Home },
        { name: "Data Master", href: "/admin/data-master", icon: Users },
        { name: "Penjadwalan Master", href: "/admin/penjadwalan", icon: Activity },
        { name: "Cetak Kartu Login", href: "/admin/cetak-kartu", icon: Printer },
    ],
    GURU: [
        { name: "Dashboard", href: "/guru", icon: Home },
        { name: "Bank Soal", href: "/guru/bank-soal", icon: BookOpen },
        { name: "Manajemen Ujian", href: "/guru/ujian", icon: FileText },
        { name: "Jadwal Ujian", href: "/guru/jadwal", icon: Activity },
        { name: "Nilai & Rekap", href: "/guru/penilaian", icon: ClipboardList }, // Diperbaiki dari /guru/nilai
    ],
    PENGAWAS: [
        { name: "Dashboard", href: "/pengawas", icon: Home },
        // Monitor Ujian dihapus dari sidebar terpisah karena sudah menyatu di halaman Dashboard Pengawas secara dinamis (membutuhkan ID Jadwal)
    ],
    SISWA: [
        { name: "Dashboard", href: "/siswa", icon: Home },
        { name: "Daftar Ujian", href: "/siswa/ujian", icon: FileText },
        { name: "Hasil Ujian", href: "/siswa/hasil", icon: ClipboardList },
    ],
};

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    role?: string;
}

export function Sidebar({ isOpen, setIsOpen, role = "SISWA" }: SidebarProps) {
    const pathname = usePathname();
    const navItems = MENUS[role as keyof typeof MENUS] || MENUS.SISWA;

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                        <Link href={`/${role.toLowerCase()}`} className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity">
                            <BookOpen className="w-6 h-6" />
                            <span className="text-xl font-bold tracking-tight text-foreground">Rovedu CBT</span>
                        </Link>
                        <button
                            className="lg:hidden p-2 -mr-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            // Exact match for root role pages (e.g., /admin), prefix match for subpages
                            const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== `/${role.toLowerCase()}`);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-[var(--radius-sm)] transition-all duration-200 ${isActive
                                        ? "bg-primary text-primary-foreground font-medium shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer (Logout) */}
                    <div className="p-4 border-t border-border">
                        <form action={logoutAction}>
                            <button type="submit" className="flex w-full items-center space-x-3 px-4 py-3 rounded-[var(--radius-sm)] text-destructive hover:bg-destructive/10 transition-colors">
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Keluar</span>
                            </button>
                        </form>
                    </div>
                </div>
            </aside>
        </>
    );
}
