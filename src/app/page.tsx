"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { BookOpen, LogIn } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8 transition-colors duration-500">
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <ThemeToggle />
      </div>

      <main className="w-full max-w-md fade-in">
        <div className="flex flex-col items-center mb-8 text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2 hover-lift">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Rovedu CBT
          </h1>
          <p className="text-muted-foreground text-sm">
            Sistem Ujian Berbasis Komputer Modern & Nyaman
          </p>
        </div>

        <div className="glass rounded-[var(--radius-lg)] p-6 sm:p-8 shadow-sm">
          <form action={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-[var(--radius-sm)] bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium">
                Username / NIS
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Masukkan username atau NIS"
                className="w-full px-4 py-3 rounded-[var(--radius-md)] bg-input/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-[var(--radius-md)] bg-input/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-200"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm text-foreground/80 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary accent-primary w-4 h-4 cursor-pointer"
                />
                <span>Ingat saya</span>
              </label>
              <a href="#" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                Lupa Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-[var(--radius-md)] font-medium flex items-center justify-center space-x-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70"
            >
              <span>{loading ? "Memproses..." : "Masuk"}</span>
              <LogIn className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Rovedu CBT. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
