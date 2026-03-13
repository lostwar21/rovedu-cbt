"use client";

import * as React from "react";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface DashboardLayoutProps {
    children: React.ReactNode;
    user?: {
        name?: string | null;
        role?: string;
    };
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                role={user?.role}
            />

            <div className="lg:ml-64 flex flex-col min-h-screen">
                <Navbar
                    onMenuClick={() => setIsSidebarOpen(true)}
                    userName={user?.name || user?.role || "User"}
                />

                <main className="flex-1 p-4 md:p-6 lg:p-8 fade-in">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
