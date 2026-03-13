"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Save, 
  Loader2, 
  AlertCircle,
  Trophy,
  Type,
  ListOrdered
} from "lucide-react";
import { updateEssayScoreAction } from "@/lib/actions/sesi";

interface Props {
  sesi: any;
  jawaban: any[];
}

export function LembarJawabSiswa({ sesi, jawaban }: Props) {
  const [isPending, startTransition] = useTransition();
  const [scores, setScores] = useState<Record<string, number>>(
    jawaban.reduce((acc, curr) => ({
      ...acc,
      [curr.id]: curr.nilaiEssay || 0
    }), {})
  );

  const handleScoreChange = (jawabanId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setScores(prev => ({ ...prev, [jawabanId]: numValue }));
  };

  const handleSaveScore = (jawabanId: string) => {
    startTransition(async () => {
      try {
        await updateEssayScoreAction({
          sesiId: sesi.id,
          jawabanId,
          score: scores[jawabanId]
        });
        alert("Nilai berhasil disimpan!");
      } catch (err: any) {
        alert("Gagal menyimpan: " + err.message);
      }
    });
  };

  const stats = {
    pgCorrect: jawaban.filter(j => j.soal.tipe === 'PG' && j.opsiDipilihId === j.soal.opsi.find((o: any) => o.benar)?.id).length,
    pgTotal: jawaban.filter(j => j.soal.tipe === 'PG').length,
    essayTotal: jawaban.filter(j => j.soal.tipe === 'ESSAY').length
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nilai Total</p>
            <p className="text-3xl font-black text-primary">{sesi.hasil?.nilaiTotal || 0}</p>
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pilihan Ganda</p>
            <p className="text-xl font-bold">{stats.pgCorrect} / {stats.pgTotal} Benar</p>
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Type className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Essay</p>
            <p className="text-xl font-bold">{stats.essayTotal} Butir</p>
          </div>
        </div>
      </div>

      {/* Daftar Jawaban */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" /> Rincian Jawaban Siswa
        </h2>

        {jawaban.map((j, index) => {
          const isPg = j.soal.tipe === 'PG';
          const isCorrect = isPg && j.opsiDipilihId === j.soal.opsi.find((o: any) => o.benar)?.id;
          const opsiDipilih = isPg ? j.soal.opsi.find((o: any) => o.id === j.opsiDipilihId) : null;
          const kunciPg = isPg ? j.soal.opsi.find((o: any) => o.benar) : null;

          return (
            <div key={j.id} className={`bg-card border-2 rounded-2xl overflow-hidden transition-all ${
              isPg ? (isCorrect ? 'border-emerald-500/20' : 'border-destructive/10') : 'border-border shadow-sm'
            }`}>
              <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Soal No. {index + 1}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  isPg ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {j.soal.tipe}
                </span>
              </div>
              
              <div className="p-6 space-y-4">
                <div 
                  className="text-sm font-medium leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: j.soal.teks }}
                />

                {isPg ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div className={`p-3 rounded-xl border ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-destructive/5 border-destructive/20'}`}>
                      <p className="text-[9px] font-bold uppercase mb-1 opacity-50">Jawaban Siswa</p>
                      <div className="flex items-center gap-2">
                        {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-destructive" />}
                        <span className="text-sm font-bold">{opsiDipilih?.teks || 'TIDAK MENJAWAB'}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-muted/20">
                      <p className="text-[9px] font-bold uppercase mb-1 opacity-50">Kunci Jawaban</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-bold">{kunciPg?.teks}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mt-6">
                    <div className="p-5 rounded-2xl bg-muted/10 border-2 border-dashed border-border">
                      <p className="text-[9px] font-black uppercase mb-3 text-primary tracking-widest">Jawaban Essay Siswa:</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap italic">
                        {j.jawabanEssay || <span className="text-muted-foreground opacity-50">Siswa tidak memberikan jawaban.</span>}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end gap-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Input Skor (Maks: {j.soal.bobot})</label>
                        <input 
                          type="number" 
                          max={j.soal.bobot}
                          min={0}
                          value={scores[j.id]}
                          onChange={(e) => handleScoreChange(j.id, e.target.value)}
                          className="w-full bg-background border border-amber-500/30 rounded-lg px-4 py-2 text-lg font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      <button 
                        disabled={isPending}
                        onClick={() => handleSaveScore(j.id)}
                        className="h-11 px-6 bg-amber-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-600 transition-all disabled:opacity-50"
                      >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        SIMPAN SKOR
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
