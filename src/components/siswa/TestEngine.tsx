"use client";

import * as React from "react";
import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Menu,
  X,
  Keyboard,
  Lock,
  Maximize
} from "lucide-react";
import { simpanJawabanAction, submitUjianAction, blokirSesiAction, resumeSesiAction } from "@/lib/actions/sesi";
import { formatWIBDate } from "@/lib/date-utils";

interface Props {
  sesi: any;
  listSoal: any[];
  jawabanExist: any[];
}

export function TestEngine({ sesi, listSoal, jawabanExist }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { opsiId?: string; essay?: string; ragu: boolean }>>({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [timeLeft, setTimeLeft] = useState(sesi.sisaDetik || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [sessionStatus, setSessionStatus] = useState(sesi.status);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [unlockToken, setUnlockToken] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [violationCount, setViolationCount] = useState(0);
  const [isBlurred, setIsBlurred] = useState(false);
  const visibilityTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const initialDimensions = React.useRef({ width: 0, height: 0 });

  // Inisialisasi dimensi layar awal
  useEffect(() => {
    initialDimensions.current = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }, []);

  // Helper: Blokir sesi dengan alasan
  const triggerBlock = useCallback((alasan: string) => {
    if (isSubmitting || sessionStatus !== "BERJALAN") return;
    setSessionStatus("DIBLOKIR");
    setViolationCount(prev => prev + 1);
    startTransition(async () => {
      await blokirSesiAction(sesi.id, alasan);
    });
  }, [sesi.id, sessionStatus, isSubmitting]);

  // =============================================
  // 🔒 LOCKDOWN SECURITY SYSTEM (8 Lapisan)
  // =============================================
  useEffect(() => {
    if (sessionStatus !== "BERJALAN") return;

    // ── Layer 1: Cegah tutup tab / refresh ──
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    // ── Layer 2: Deteksi pindah tab (Visibility Change) dengan Grace Period ──
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Jangan langsung blokir, beri waktu 10 detik (Toleransi Layar Mati / Swipe accidental)
        visibilityTimeoutRef.current = setTimeout(() => {
          triggerBlock("Siswa meninggalkan halaman terlalu lama (Grace Period Expired).");
        }, 10000); // 10 Detik
      } else {
        // Jika kembali sebelum 10 detik, batalkan pemblokiran
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
          visibilityTimeoutRef.current = null;
        }
      }
    };

    // ── Layer 3: Deteksi keluar Fullscreen & Split Screen (Resize) ──
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        // Cek apakah keluar karena sengaja atau karena resize (split screen)
        triggerBlock("Siswa keluar dari mode layar penuh (Fullscreen).");
      } else {
        setIsFullscreen(true);
      }
    };

    const handleResize = () => {
      if (sessionStatus !== "BERJALAN") return;
      
      const widthDiff = Math.abs(window.innerWidth - initialDimensions.current.width);
      const heightDiff = Math.abs(window.innerHeight - initialDimensions.current.height);

      // Jika layar berubah > 20% secara mendadak, kemungkinan split screen atau resize manual
      if (widthDiff > initialDimensions.current.width * 0.2 || heightDiff > initialDimensions.current.height * 0.2) {
        triggerBlock("Deteksi pembagian layar (Split Screen) atau perubahan ukuran jendela.");
      }
    };

    // ── Layer 4: Cegah tombol BACK browser ──
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      triggerBlock("Siswa menekan tombol KEMBALI (Back) di browser.");
    };

    // ── Layer 5: Window Blur (Kehilangan Fokus — Mitigasi Shield) ──
    const handleBlur = () => {
      // Tunggu sebentar untuk memastikan fokus benar-benar pindah ke luar, bukan ke iframe video
      setTimeout(() => {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.tagName === "IFRAME") {
          return; // Fokus di video, jangan aktifkan shield
        }
        setIsBlurred(true);
      }, 100);
    };

    const handleFocus = () => {
      setIsBlurred(false);
    };

    // ── Layer 6: Blokir Keyboard Shortcut Berbahaya ──
    const handleKeyDown = (e: KeyboardEvent) => {
      const blocked = [
        // Shortcut pindah aplikasi
        e.altKey && e.key === "Tab",       // Alt+Tab (Windows)
        e.metaKey && e.key === "Tab",      // Cmd+Tab (Mac)
        e.ctrlKey && e.key === "Tab",      // Ctrl+Tab (pindah tab browser)
        e.key === "Meta" || e.key === "OS",// Tombol Windows/Command
        // Shortcut Developer Tools & Refresh
        e.key === "F12",                   // DevTools
        e.ctrlKey && e.shiftKey && e.key === "I", // Ctrl+Shift+I (Inspect)
        e.ctrlKey && e.shiftKey && e.key === "J", // Ctrl+Shift+J (Console)
        e.ctrlKey && e.key === "u",        // Ctrl+U (View Source)
        e.key === "F5",                    // Refresh
        e.ctrlKey && e.key === "r",        // Ctrl+R (Refresh)
        e.key === "F11",                   // Toggle Fullscreen
        // Screenshot
        e.key === "PrintScreen",
        (e.metaKey && e.shiftKey && e.key === "3"), // Mac Full Screenshot
        (e.metaKey && e.shiftKey && e.key === "4"), // Mac Partial Screenshot
        (e.metaKey && e.shiftKey && e.key === "5"), // Mac Video Record
        // Escape
        e.key === "Escape",
      ];

      if (blocked.some(Boolean)) {
        e.preventDefault();
        e.stopPropagation();
        // Hanya blokir untuk shortcut escape dari layar ujian
        if (
          (e.altKey && e.key === "Tab") ||
          (e.metaKey && e.key === "Tab") ||
          (e.ctrlKey && e.key === "Tab") ||
          e.key === "Meta" || e.key === "OS" ||
          e.key === "PrintScreen"
        ) {
          triggerBlock(`Siswa menekan shortcut terlarang: ${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.metaKey ? 'Meta+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`);
        }
        return false;
      }
    };

    // ── Layer 7: Cegah Copy, Paste, Cut, Select All ──
    const handleCopy = (e: Event) => { e.preventDefault(); };
    const handlePaste = (e: Event) => { e.preventDefault(); };
    const handleCut = (e: Event) => { e.preventDefault(); };
    const handleSelectStart = (e: Event) => {
      // Izinkan select pada textarea (untuk essay), blokir sisanya
      const target = e.target as HTMLElement;
      if (target.tagName !== "TEXTAREA" && target.tagName !== "INPUT") {
        e.preventDefault();
      }
    };

    // ── Layer 8: Blokir klik kanan ──
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    // ── Pasang semua listener ──
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("resize", handleResize);
    document.addEventListener("keydown", handleKeyDown, true); // capture phase
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("contextmenu", handleContextMenu);

    // ── CSS tambahan: Cegah seleksi teks pada soal ──
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    return () => {
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    };
  }, [sesi.id, sessionStatus, isSubmitting, triggerBlock]);

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error("Gagal masuk mode layar penuh:", err);
      alert("Browser Anda tidak mendukung layar penuh atau diblokir.");
    }
  };

  const handleUnlock = () => {
    setUnlockError("");
    // Jangan gunakan startTransition di sini agar feedback lebih instan jika diinginkan,
    // atau gunakan async langsung untuk kontrol lebih detail
    const doUnlock = async () => {
      try {
        const res = await resumeSesiAction(sesi.id, unlockToken);
        if (res.success) {
          // Update status lokal secara instan
          setSessionStatus("BERJALAN");
          setUnlockToken("");
          // Tunggu sebentar lalu masuk fullscreen
          setTimeout(() => {
            enterFullscreen();
          }, 100);
        } else {
          // @ts-ignore
          setUnlockError(res.message || "Token salah atau gagal membuka blokir.");
        }
      } catch (err: any) {
        setUnlockError(err.message);
      }
    };
    doUnlock();
  };

  const currentSoal = listSoal[currentIndex];

  // Initialize answers from database
  useEffect(() => {
    const initialAnswers: Record<string, any> = {};
    jawabanExist.forEach(j => {
      initialAnswers[j.soalId] = {
        opsiId: j.opsiDipilihId,
        essay: j.jawabanEssay,
        ragu: j.ragu
      };
    });
    setAnswers(initialAnswers);
  }, [jawabanExist]);

  const handleAutoSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await submitUjianAction(sesi.id);
      router.push('/siswa/ujian');
    } catch (err) {
      console.error("Auto-submit failed", err);
    }
  }, [sesi.id, router]);

  // Timer logic
  useEffect(() => {
    if (sessionStatus !== "BERJALAN" || isSubmitting) return;

    const interval = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStatus, isSubmitting, handleAutoSubmit]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };



  const handleSaveAnswer = async (soalId: string, data: { opsiId?: string; essay?: string; ragu?: boolean }) => {
    const newAnswers = {
      ...answers,
      [soalId]: {
        ...(answers[soalId] || { ragu: false }),
        ...data
      }
    };
    setAnswers(newAnswers);

    // Sync to database (fire and forget for UI snappiness)
    startTransition(async () => {
      try {
        await simpanJawabanAction({
          sesiId: sesi.id,
          soalId,
          opsiId: newAnswers[soalId].opsiId,
          essay: newAnswers[soalId].essay,
          ragu: newAnswers[soalId].ragu
        });
      } catch (err) {
        console.error("Sync failed", err);
      }
    });
  };

  const handleSubmit = async () => {
    const totalAnswered = Object.keys(answers).length;
    const totalSoal = listSoal.length;
    
    if (confirm(`Apakah Anda yakin ingin mengakhiri ujian? \nTerjawab: ${totalAnswered} dari ${totalSoal} soal.`)) {
      setIsSubmitting(true);
      try {
        await submitUjianAction(sesi.id);
        router.push('/siswa/ujian');
      } catch (err: any) {
        alert("Gagal mengakhiri ujian: " + err.message);
        setIsSubmitting(false);
      }
    }
  };

  if (isSubmitting) {
    return (
      <div className="fixed inset-0 bg-background z-[200] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-xl font-bold">Sedang memproses jawaban Anda...</p>
        <p className="text-muted-foreground">Mohon jangan menutup halaman ini.</p>
      </div>
    );
  }

  if (!listSoal || listSoal.length === 0) {
    return (
      <div className="fixed inset-0 bg-background z-[200] flex flex-col items-center justify-center space-y-4 p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500" />
        <h1 className="text-2xl font-bold">Soal Belum Siap</h1>
        <p className="text-muted-foreground max-w-md">Data soal tidak ditemukan atau belum diatur oleh guru. Silakan hubungi pengawas.</p>
        <button 
          onClick={() => router.push('/siswa/ujian')}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  if (sessionStatus === "DIBLOKIR") {
    return (
      <div className="fixed inset-0 bg-background z-[300] flex items-center justify-center p-4">
        <div className="bg-card border-2 border-destructive max-w-md w-full rounded-2xl shadow-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-destructive mb-2 uppercase tracking-wide">Ujian Diblokir!</h2>
            <p className="text-muted-foreground font-medium">Sistem mendeteksi aktivitas mencurigakan.</p>
            {violationCount > 0 && (
              <p className="text-xs text-destructive mt-2 bg-destructive/5 px-3 py-1 rounded-full inline-block">
                ⚠️ Pelanggaran ke-{violationCount} — Semua tercatat di server
              </p>
            )}
          </div>
          <div className="bg-muted p-4 rounded-xl text-left border border-border space-y-4">
            <p className="text-sm">Angkat tangan dan lapor <strong>Pengawas</strong> untuk mendapatkan <strong>Token Buka Kunci</strong>.</p>
            <div className="space-y-1">
              <input 
                type="text" 
                value={unlockToken}
                onChange={(e) => setUnlockToken(e.target.value.toUpperCase())}
                placeholder="Masukkan Token Pengawas..."
                className="w-full bg-background border border-border rounded-md px-3 py-3 text-center text-xl font-mono focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                autoFocus
              />
              {unlockError && <p className="text-xs text-destructive text-center">{unlockError}</p>}
            </div>
          </div>
          <button 
            disabled={isPending || !unlockToken}
            onClick={handleUnlock}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buka Blokir Sesi"}
          </button>
        </div>
      </div>
    );
  }

  if (!isFullscreen && sessionStatus !== "SELESAI") {
    return (
      <div className="fixed inset-0 bg-background z-[200] flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-lg space-y-6">
          <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <Maximize className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-2">Mode Ujian Aman</h1>
            <p className="text-muted-foreground text-sm">
              Ujian ini berjalan dalam mode <strong>Layar Penuh Terkunci</strong>. 
              Anda akan <strong>diblokir otomatis</strong> jika terdeteksi membuka aplikasi lain, meminimize browser, atau menekan tombol kembali.
            </p>
          </div>

          {/* Panduan Screen Pinning */}
          <div className="bg-muted/50 border border-border rounded-xl p-4 text-left space-y-3">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">📌 Wajib: Kunci Layar Perangkat</p>
            <div className="text-xs text-muted-foreground space-y-2">
              <div>
                <p className="font-semibold text-foreground">Android:</p>
                <p>Pengaturan → Keamanan → <strong>Sematkan Layar (Screen Pinning)</strong> → Aktifkan. Lalu buka Recent Apps, ketuk ikon 📌 pada Chrome.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">iOS (iPhone/iPad):</p>
                <p>Pengaturan → Aksesibilitas → <strong>Guided Access</strong> → Aktifkan lalu set Passcode. Buka Safari, triple-click tombol samping → Start.</p>
              </div>
            </div>
          </div>

          <button 
            onClick={enterFullscreen}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] shadow-xl flex items-center justify-center gap-3"
          >
            <Maximize className="w-6 h-6" /> Masuk Layar Penuh & Mulai
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      
      {/* 🛡️ SCREEN SHIELD (Cegah Screenshot saat Blur) */}
      {isBlurred && sessionStatus === "BERJALAN" && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Lock className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black mb-2">Layar Terkunci sementara</h2>
            <p className="text-muted-foreground max-w-sm">
                Konten disembunyikan karena layar kehilangan fokus. 
                Klik kembali ke area ini untuk melanjutkan ujian.
            </p>
            <div className="mt-8 px-4 py-2 bg-muted rounded-full text-xs font-mono">
                SAFETY_MODE: SHIELD_ACTIVE
            </div>
        </div>
      )}

      {/* 💧 WATERMARK (Deterrent Screenshot) */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] overflow-hidden select-none" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex whitespace-nowrap gap-10 -rotate-12 mb-20 text-4xl font-black uppercase">
            {Array.from({ length: 10 }).map((_, j) => (
              <span key={j}>{sesi.siswaName || 'PESERTA'} - {sesi.id.slice(-5)} - {formatWIBDate(new Date())}</span>
            ))}
          </div>
        ))}
      </div>

      {/* Header Bar */}
      <header className="h-16 border-b border-border bg-card sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSidebar(true)}
            className="p-2 hover:bg-muted rounded-md lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg leading-tight truncate max-w-[200px] md:max-w-md">{sesi.ujian.judul}</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{sesi.ujian.mapel}</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 px-4 py-2 rounded-full border border-border shadow-inner font-mono text-xl ${timeLeft < 300 ? 'bg-destructive/10 text-destructive animate-pulse border-destructive/20' : 'bg-muted/50 text-foreground'}`}>
          <Clock className="w-5 h-5" />
          <span>{formatTime(timeLeft)}</span>
        </div>

        <button 
          onClick={handleSubmit}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover-lift"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Selesai Ujian</span>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {/* Soal Meta */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Pertanyaan Ke {currentIndex + 1} Dari {listSoal.length}</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={answers[currentSoal.id]?.ragu || false}
                    onChange={(e) => handleSaveAnswer(currentSoal.id, { ragu: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span className={`text-xs font-bold transition-colors ${answers[currentSoal.id]?.ragu ? 'text-amber-500' : 'text-muted-foreground group-hover:text-foreground'}`}>Ragu-ragu</span>
                </label>
              </div>
            </div>

            {/* Teks Soal */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div 
                className="text-xl md:text-2xl leading-relaxed font-medium"
                dangerouslySetInnerHTML={{ __html: currentSoal.teks }}
              />
            </div>

            {/* Opsi / Input */}
            <div className="space-y-4 pt-4">
              {currentSoal.tipe === "PG" ? (
                <div className="grid grid-cols-1 gap-3">
                  {currentSoal.opsi.map((o: any, idx: number) => {
                    const alphabet = String.fromCharCode(65 + idx);
                    const isSelected = answers[currentSoal.id]?.opsiId === o.id;
                    return (
                      <button
                        key={o.id}
                        onClick={() => handleSaveAnswer(currentSoal.id, { opsiId: o.id })}
                        className={`group flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 hover-lift ${
                          isSelected 
                            ? 'bg-primary/5 border-primary shadow-md' 
                            : 'bg-card border-border hover:border-primary/40'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border transition-colors flex-shrink-0 ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'bg-muted text-muted-foreground border-border group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20'
                        }`}>
                          {alphabet}
                        </div>
                        <div 
                          className={`text-base md:text-lg transition-colors ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground animate-text-in text-foreground'}`}
                          dangerouslySetInnerHTML={{ __html: o.teks }}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">JAWABAN ESSAY ANDA:</label>
                  <textarea 
                    rows={8}
                    value={answers[currentSoal.id]?.essay || ""}
                    onChange={(e) => handleSaveAnswer(currentSoal.id, { essay: e.target.value })}
                    className="w-full p-4 rounded-xl border border-border bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary text-lg transition-all outline-none md:text-xl font-serif"
                    placeholder="Ketikkan jawaban Anda di sini..."
                  />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 italic">
                    <CheckCircle2 className="w-3 h-3 text-primary" /> Jawaban otomatis tersimpan setiap kali Anda mengetik.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Desktop Sidebar Navigator */}
        <aside className="hidden lg:flex w-80 border-l border-border bg-card flex-col">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="font-bold flex items-center gap-2">
              <Keyboard className="w-4 h-4" /> Navigasi Soal
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-5 gap-2">
              {listSoal.map((_, idx) => {
                const soalId = listSoal[idx].id;
                const isAnswered = !!(answers[soalId]?.opsiId || (answers[soalId]?.essay && answers[soalId]?.essay.length > 5));
                const isRagu = answers[soalId]?.ragu;
                const isCurrent = currentIndex === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-11 rounded-lg border flex items-center justify-center font-bold text-sm transition-all duration-200 hover-lift ${
                      isCurrent 
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg ring-2 ring-primary/20 scale-110 z-10' 
                        : isRagu
                          ? 'bg-amber-500 text-white border-amber-500'
                          : isAnswered
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'bg-background text-muted-foreground hover:bg-muted border-border'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-6 border-t border-border space-y-3">
             <div className="flex items-center gap-6 justify-center">
                <div className="flex flex-col items-center gap-1">
                   <div className="w-4 h-4 rounded bg-primary/10 border border-primary/30" />
                   <span className="text-[10px] text-muted-foreground">Terisi</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                   <div className="w-4 h-4 rounded bg-amber-500" />
                   <span className="text-[10px] text-muted-foreground">Ragu</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                   <div className="w-4 h-4 rounded bg-primary ring-2 ring-primary/20" />
                   <span className="text-[10px] text-muted-foreground">Aktif</span>
                </div>
             </div>
          </div>
        </aside>
      </div>

      {/* Navigation Footer */}
      <footer className="h-20 border-t border-border bg-card px-4 md:px-8 flex items-center justify-between sticky bottom-0 z-50">
        <button 
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(prev => prev - 1)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-bold"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        <div className="lg:hidden">
           <button 
              onClick={() => setShowSidebar(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground font-bold text-sm"
           >
              No. {currentIndex + 1} / {listSoal.length}
           </button>
        </div>

        <button 
          disabled={currentIndex === listSoal.length - 1}
          onClick={() => setCurrentIndex(prev => prev + 1)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-bold"
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </footer>

      {/* Mobile Navigator Overlay */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
          <div className="relative w-80 bg-card h-full ml-auto shadow-2xl border-l border-border flex flex-col slide-in-right">
             <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2">Navigator Soal</h2>
                <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-muted rounded-full">
                   <X className="w-5 h-5" />
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 grid grid-cols-4 gap-2">
                {listSoal.map((_, idx) => {
                  const soalId = listSoal[idx].id;
                  const isAnswered = !!(answers[soalId]?.opsiId || (answers[soalId]?.essay && answers[soalId]?.essay.length > 5));
                  const isRagu = answers[soalId]?.ragu;
                  const isCurrent = currentIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => { setCurrentIndex(idx); setShowSidebar(false); }}
                      className={`h-14 rounded-xl border flex items-center justify-center font-bold ${
                        isCurrent 
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg ring-2 ring-primary/20 scale-105' 
                          : isRagu
                            ? 'bg-amber-500 text-white border-amber-500'
                            : isAnswered
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : 'bg-background text-muted-foreground border-border'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
