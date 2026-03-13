"use client";

import * as React from "react";
import { Menu, Bell, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavbarProps {
    onMenuClick: () => void;
    userName?: string;
}

export function Navbar({ onMenuClick, userName = "User" }: NavbarProps) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6 backdrop-blur-md transition-colors">
            <div className="flex items-center lg:hidden">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 mr-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                    aria-label="Open menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 lg:flex-none">
                {/* Breadcrumbs or Page Title could go here */}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
                <ThemeToggle />

                <button className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-destructive rounded-full" />
                </button>

                <div className="h-8 w-px bg-border mx-1"></div>

                <button className="flex items-center space-x-2 p-1.5 hover:bg-muted rounded-full transition-colors">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium hidden sm:block mr-2 text-foreground">
                        {userName}
                    </span>
                </button>
            </div>
        </header>
    );
}
