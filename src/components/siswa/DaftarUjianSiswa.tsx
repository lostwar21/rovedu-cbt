"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Key, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { mulaiUjianAction } from "@/lib/actions/sesi";
import { Modal } from "@/components/ui/Modal";

interface Props {
  data: {
    jadwal: any[];
    sesiSiswa: any[];
    siswaId: string;
  };
}

export function DaftarUjianSiswa({ data }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<any>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleMulaiClick = (j: any) => {
    setError(null);
    if (j.ujian.token) {
      setSelectedJadwal(j);
      setShowTokenModal(true);
    } else {
      executeMulaiUjian(j.id);
    }
  };

  const executeMulaiUjian = (jadwalId: string, token?: string) => {
    startTransition(async () => {
      try {
        const result = await mulaiUjianAction({ jadwalId, tokenInput: token });
        if (result.success) {
          router.push(`/ujian-room/${result.sesiId}`);
        }
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const getSesiStatus = (ujianId: string) => {
    return data.sesiSiswa.find(s => s.ujianId === ujianId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Daftar Ujian</h1>
        <p className="text-muted-foreground text-sm">Berikut adalah daftar ujian yang tersedia untuk Anda.</p>
      </div>

      {data.jadwal.length === 0 ? (
        <div className="p-14 text-center glass rounded-xl border border-dashed border-border">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-muted-foreground">Tidak ada jadwal ujian aktif saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.jadwal.map((j) => {
            const sesi = getSesiStatus(j.ujianId);
            const isSelesai = sesi?.status === "SELESAI";
            const isBerjalan = sesi?.status === "BERJALAN";
            const now = new Date();
            const isBelumMulai = now < new Date(j.waktuMulai);

            return (
              <div key={j.id} className={`glass p-5 rounded-xl border border-border/50 relative overflow-hidden transition-all ${isSelesai ? 'opacity-70' : 'hover:border-primary/40'}`}>
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {isSelesai ? (
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Selesai
                    </span>
                  ) : isBelumMulai ? (
                    <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase border border-border/50">
                      Belum Mulai
                    </span>
                  ) : (
                    <span className="animate-pulse px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-bold uppercase border border-blue-500/20">
                      Tersedia
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{j.ujian.mataPelajaran.nama}</p>
                    <h3 className="font-bold text-lg leading-tight pr-12">{j.ujian.judul}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(j.waktuMulai).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{j.ujian.durasi} Menit</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{j.ruang.nama}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Key className="w-3.5 h-3.5" />
                      <span>{j.ujian.token ? "Butuh Token" : "Tanpa Token"}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {isSelesai ? (
                      <button disabled className="w-full py-2.5 rounded-lg bg-muted text-muted-foreground font-medium text-sm border border-border/50">
                        Ujian Sudah Selesai
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMulaiClick(j)}
                        disabled={isPending || isBelumMulai}
                        className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                          isBelumMulai 
                            ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-primary/20'
                        }`}
                      >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <>
                            {isBerjalan ? "Lanjutkan Ujian" : "Mulai Ujian"}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                    {isBelumMulai && (
                      <p className="text-[10px] text-center text-muted-foreground mt-2 italic">
                        Ujian dimulai pukul {new Date(j.waktuMulai).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Token Modal */}
      <Modal
        isOpen={showTokenModal}
        onClose={() => !isPending && setShowTokenModal(false)}
        title="Masukkan Token"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Ujian "{selectedJadwal?.ujian.judul}" memerlukan token untuk memulai.</p>
          
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Contoh: ASD123"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              className="w-full text-center text-2xl font-mono py-3 rounded-lg bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 transition-all uppercase placeholder:opacity-50"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowTokenModal(false)}
              className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted font-medium text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isPending || !tokenInput}
              onClick={() => executeMulaiUjian(selectedJadwal.id, tokenInput)}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validasi"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
