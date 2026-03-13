"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Plus, Trash2, ArrowLeft, Save, LayoutGrid, CheckCircle2, Circle, AlertCircle, FileText, Settings2, Image as ImageIcon, Loader2, X, Edit2 } from "lucide-react";
import { createSoalPG, createSoalEssay, updateSoalPG, updateSoalEssay, deleteSoal } from "@/lib/actions/soal";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BankSoalLengkap {
  id: string;
  nama: string;
  mataPelajaran: { nama: string; kode: string };
  soal: any[];
}

interface Props {
  bankSoal: BankSoalLengkap;
}

export function EditorSoalLanjutan({ bankSoal }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"LIST" | "ADD_PG" | "ADD_ESSAY">("LIST");
  const [editingSoal, setEditingSoal] = useState<any | null>(null);
  
  // State Input Form Soal Universal
  const [teks, setTeks] = useState("");
  const [bobot, setBobot] = useState("1");
  const [tingkatKesulitan, setTingkatKesulitan] = useState("SEDANG");
  const [taksonomi, setTaksonomi] = useState("");
  const [kompetensiDasar, setKompetensiDasar] = useState("");
  
  // State Khusus PG
  const [acakOpsi, setAcakOpsi] = useState(true);
  const [opsi, setOpsi] = useState<{ teks: string; benar: boolean }[]>([
    { teks: "", benar: true },
    { teks: "", benar: false },
    { teks: "", benar: false },
    { teks: "", benar: false },
  ]);

  // State Khusus Essay
  const [rubrikPenilaian, setRubrikPenilaian] = useState("");
  const [izinkanLampiran, setIzinkanLampiran] = useState(false);

  const resetForm = () => {
    setTeks("");
    setBobot("1");
    setTingkatKesulitan("SEDANG");
    setTaksonomi("");
    setKompetensiDasar("");
    setAcakOpsi(true);
    setOpsi([
      { teks: "", benar: true },
      { teks: "", benar: false },
      { teks: "", benar: false },
      { teks: "", benar: false },
    ]);
    setRubrikPenilaian("");
    setIzinkanLampiran(false);
  };

  // Membuka form edit dengan data soal yang sudah ada
  const handleEditSoal = (s: any) => {
    setEditingSoal(s);
    setTeks(s.teks || "");
    setBobot(String(s.bobot || 1));
    // Untuk PG, pre-fill opsi jawaban
    if (s.tipe === "PG" && s.opsi) {
      setOpsi(s.opsi.map((o: any) => ({ teks: o.teks, benar: o.benar })));
      setMode("ADD_PG");
    } else {
      setMode("ADD_ESSAY");
    }
  };

  const handeTambahOpsi = () => {
    setOpsi([...opsi, { teks: "", benar: false }]);
  };

  const handleSetBenar = (index: number) => {
    const newOpsi = opsi.map((o, i) => ({ ...o, benar: i === index }));
    setOpsi(newOpsi);
  };

  const handleHapusOpsi = (index: number) => {
    if (opsi.length <= 2) return alert("Minimal harus ada 2 opsi jawaban.");
    const newOpsi = [...opsi];
    newOpsi.splice(index, 1);
    // Jika yang dihapus adalah jawaban benar, set jawaban benar ke opsi pertama
    if (opsi[index].benar && newOpsi.length > 0) {
        newOpsi[0].benar = true;
    }
    setOpsi(newOpsi);
  };

  const handleUpdateOpsiTeks =(index: number, val: string) => {
      const newOpsi = [...opsi];
      newOpsi[index].teks = val;
      setOpsi(newOpsi);
  };

  const handleSimpanPG = async () => {
    if (!teks.trim()) return alert("Teks soal tidak boleh kosong.");
    if (opsi.some(o => !o.teks.trim())) return alert("Semua kolom opsi jawaban harus diisi.");
    if (!opsi.some(o => o.benar)) return alert("Harus ada satu opsi jawaban yang ditandai benar.");

    startTransition(async () => {
        try {
            if (editingSoal) {
                await updateSoalPG(bankSoal.id, editingSoal.id, { teks, bobot, opsi });
            } else {
                await createSoalPG(bankSoal.id, { teks, bobot, tingkatKesulitan, taksonomi, kompetensiDasar, acakOpsi, opsi });
            }
            setEditingSoal(null);
            resetForm();
            setMode("LIST");
            router.refresh();
        } catch (error: any) {
            alert("Gagal menyimpan soal: " + (error.message || "Terjadi kesalahan."));
        }
    });
  };

  const handleSimpanEssay = async () => {
    if (!teks.trim()) return alert("Teks soal tidak boleh kosong.");

    startTransition(async () => {
        try {
            if (editingSoal) {
                await updateSoalEssay(bankSoal.id, editingSoal.id, { teks, bobot });
            } else {
                await createSoalEssay(bankSoal.id, { teks, bobot, tingkatKesulitan, taksonomi, kompetensiDasar, rubrikPenilaian, izinkanLampiran });
            }
            setEditingSoal(null);
            resetForm();
            setMode("LIST");
            router.refresh();
        } catch (error: any) {
            alert("Gagal menyimpan soal: " + (error.message || "Terjadi kesalahan."));
        }
    });
  };

  const handleDeleteSoal = async (soalId: string) => {
     if (confirm("Hapus soal ini dari bank soal?")) {
         startTransition(async () => {
             await deleteSoal(bankSoal.id, soalId);
             router.refresh(); // Refresh agar soal yang dihapus hilang dari tampilan
         });
     }
  };


  if (mode === "ADD_PG") {
      return (
          <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex items-center gap-4">
               <button onClick={() => { setEditingSoal(null); resetForm(); setMode("LIST"); }} className="p-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"><ArrowLeft className="w-5 h-5"/></button>
               <div>
                 <h2 className="text-2xl font-bold text-foreground">{editingSoal ? "Edit Soal Pilihan Ganda" : "Tambah Soal Pilihan Ganda"}</h2>
                 <p className="text-muted-foreground text-sm">Masukan detail soal, opsi jawaban, dan pengaturan parameternya.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* KOLOM KIRI: EDITOR SOAL & OPSI */}
               <div className="lg:col-span-2 space-y-6">
                   <div className="glass rounded-[var(--radius-lg)] p-6 space-y-4">
                       <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary"/> Teks Pertanyaan</h3>
                       <div className="space-y-2">
                           <textarea 
                             rows={4}
                             value={teks}
                             onChange={(e) => setTeks(e.target.value)}
                             placeholder="Ketikkan isi pertanyaan Anda di sini..."
                             className="w-full px-4 py-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all custom-scrollbar"
                           />
                           <div className="flex gap-2">
                               <button className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground transition-colors border border-border/50">
                                   <ImageIcon className="w-3.5 h-3.5"/> Sisipkan Gambar (BETA)
                               </button>
                           </div>
                       </div>
                   </div>

                   <div className="glass rounded-[var(--radius-lg)] p-6 space-y-4">
                       <div className="flex items-center justify-between">
                           <h3 className="font-semibold flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-primary"/> Opsi Jawaban</h3>
                           <button onClick={handeTambahOpsi} className="text-xs font-medium text-primary hover:text-primary-foreground hover:bg-primary px-2 py-1 flex items-center gap-1 rounded transition-colors">
                               <Plus className="w-3.5 h-3.5"/> Tambah Opsi
                           </button>
                       </div>
                       
                       <div className="space-y-3">
                           {opsi.map((o, idx) => (
                               <div key={idx} className={`flex items-start gap-3 p-3 rounded-md border transition-all ${o.benar ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-background/50'}`}>
                                   <button 
                                      onClick={() => handleSetBenar(idx)}
                                      className="mt-2 text-muted-foreground hover:text-emerald-500 transition-colors"
                                      title="Tandai sebagai jawaban benar"
                                   >
                                       {o.benar ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                                   </button>
                                   <div className="flex-1 space-y-2">
                                       <textarea 
                                          rows={1}
                                          value={o.teks}
                                          onChange={(e) => handleUpdateOpsiTeks(idx, e.target.value)}
                                          placeholder={`Isi opsi jawaban ${String.fromCharCode(65 + idx)}...`}
                                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-foreground resize-none block"
                                       />
                                   </div>
                                   <button onClick={() => handleHapusOpsi(idx)} className="text-muted-foreground hover:text-destructive p-2 mt-0.5" title="Hapus opsi">
                                       <X className="w-4 h-4"/>
                                   </button>
                               </div>
                           ))}
                       </div>
                       <p className="text-xs text-muted-foreground flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5"/> Klik ikon lingkaran untuk menetapkan Kunci Jawaban.</p>
                   </div>
               </div>

               {/* KOLOM KANAN: PENGATURAN METADATA */}
               <div className="space-y-6">
                   <div className="glass rounded-[var(--radius-lg)] p-6 space-y-5">
                       <h3 className="font-semibold flex items-center gap-2 border-b border-border/50 pb-3"><Settings2 className="w-4 h-4 text-primary"/>  Parameter Soal</h3>
                       
                       <div className="space-y-2">
                           <label className="text-sm font-medium text-foreground">Bobot Nilai (Poin)</label>
                           <input type="number" min="1" value={bobot} onChange={(e) => setBobot(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 text-sm" />
                       </div>

                       <div className="space-y-2">
                           <label className="text-sm font-medium text-foreground">Tingkat Kesulitan</label>
                           <select value={tingkatKesulitan} onChange={(e) => setTingkatKesulitan(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 text-sm">
                               <option value="MUDAH">Mudah</option>
                               <option value="SEDANG">Sedang</option>
                               <option value="SULIT">Sulit</option>
                           </select>
                       </div>

                       <div className="space-y-2">
                           <label className="text-sm font-medium text-foreground">Taksonomi Bloom</label>
                           <select value={taksonomi} onChange={(e) => setTaksonomi(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 text-sm">
                               <option value="">- Tanpa Label -</option>
                               <option value="C1">C1 - Mengingat (Remembering)</option>
                               <option value="C2">C2 - Memahami (Understanding)</option>
                               <option value="C3">C3 - Mengaplikasikan (Applying)</option>
                               <option value="C4">C4 - Menganalisis (Analyzing)</option>
                               <option value="C5">C5 - Mengevaluasi (Evaluating)</option>
                               <option value="C6">C6 - Mencipta (Creating)</option>
                           </select>
                       </div>

                       <div className="space-y-2">
                           <label className="text-sm font-medium text-foreground">Kompetensi Dasar (KD)</label>
                           <input type="text" placeholder="Contoh: 3.1" value={kompetensiDasar} onChange={(e) => setKompetensiDasar(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 text-sm" />
                       </div>

                       <div className="pt-2">
                           <label className="flex items-center gap-3 p-3 bg-muted/40 border border-border/60 rounded-md cursor-pointer hover:bg-muted/60 transition-colors">
                               <input type="checkbox" checked={acakOpsi} onChange={() => setAcakOpsi(!acakOpsi)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                               <div className="space-y-0.5">
                                 <p className="text-sm font-medium text-foreground">Acak Urutan Opsi</p>
                                 <p className="text-[10px] text-muted-foreground whitespace-normal leading-tight">Jika aktif, opsi A,B,C,D akan diacak posisinya untuk tiap siswa</p>
                               </div>
                           </label>
                       </div>
                   </div>

                   <button 
                      onClick={handleSimpanPG} 
                      disabled={isPending}
                      className="w-full flex justify-center items-center gap-2 py-3 bg-primary text-primary-foreground rounded-[var(--radius-md)] font-semibold hover:bg-primary/90 transition-all shadow-md hover-lift"
                   >
                       {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} {editingSoal ? "Update Soal" : "Simpan Soal PG"}
                   </button>
               </div>
            </div>
          </div>
      );
  }

  if (mode === "ADD_ESSAY") {
      return (
          <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex items-center gap-4">
               <button onClick={() => { setEditingSoal(null); resetForm(); setMode("LIST"); }} className="p-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"><ArrowLeft className="w-5 h-5"/></button>
               <div>
                 <h2 className="text-2xl font-bold text-foreground">{editingSoal ? "Edit Soal Uraian" : "Tambah Soal Uraian (Essay)"}</h2>
                 <p className="text-muted-foreground text-sm">Masukan detail soal essay dan rubrik penilaian.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* KOLOM KIRI: EDITOR SOAL & RUBRIK */}
               <div className="lg:col-span-2 space-y-6">
                   <div className="glass rounded-[var(--radius-lg)] p-6 space-y-4">
                       <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary"/> Teks Pertanyaan</h3>
                       <div className="space-y-2">
                           <textarea 
                             rows={6}
                             value={teks}
                             onChange={(e) => setTeks(e.target.value)}
                             placeholder="Ketikkan isi pertanyaan Anda di sini..."
                             className="w-full px-4 py-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all custom-scrollbar"
                           />
                           <div className="flex gap-2">
                               <button className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground transition-colors border border-border/50">
                                   <ImageIcon className="w-3.5 h-3.5"/> Sisipkan Gambar (BETA)
                               </button>
                           </div>
                       </div>
                   </div>

                   <div className="glass rounded-[var(--radius-lg)] p-6 space-y-4">
                       <h3 className="font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4 text-emerald-500"/> Rubrik / Kunci Jawaban</h3>
                       <p className="text-xs text-muted-foreground">Catatan ini hanya dapat dilihat oleh Guru. Sangat berguna sebagai panduan saat mengoreksi jawaban siswa secara manual.</p>
                       <div className="space-y-2">
                           <textarea 
                             rows={4}
                             value={rubrikPenilaian}
                             onChange={(e) => setRubrikPenilaian(e.target.value)}
                             placeholder="Ketikkan kata kunci jawaban atau poin-poin penilaian yang diharapkan..."
                             className="w-full px-4 py-3 rounded-md border border-amber-500/30 bg-amber-500/5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all custom-scrollbar text-sm"
                           />
                       </div>
                   </div>
               </div>

               {/* KOLOM KANAN: PENGATURAN METADATA */}
               <div className="space-y-6">
                   <div className="glass rounded-[var(--radius-lg)] p-6 space-y-5">
                       <h3 className="font-semibold flex items-center gap-2 border-b border-border/50 pb-3"><Settings2 className="w-4 h-4 text-primary"/> Parameter Soal</h3>
                       
                       <div className="space-y-2">
                           <label className="text-sm font-medium text-foreground">Bobot Nilai Maksimal (Poin)</label>
                           <input type="number" min="1" value={bobot} onChange={(e) => setBobot(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 text-sm" />
                       </div>

                       <div className="space-y-2">
                           <label className="text-sm font-medium text-foreground">Tingkat Kesulitan</label>
                           <select value={tingkatKesulitan} onChange={(e) => setTingkatKesulitan(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 text-sm">
                               <option value="MUDAH">Mudah</option>
                               <option value="SEDANG">Sedang</option>
                               <option value="SULIT">Sulit</option>
                           </select>
                       </div>

                       <div className="space-y-2">
                           <label className="text-sm font-medium text-foreground">Taksonomi Bloom</label>
                           <select value={taksonomi} onChange={(e) => setTaksonomi(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 text-sm">
                               <option value="">- Tanpa Label -</option>
                               <option value="C1">C1 - Mengingat (Remembering)</option>
                               <option value="C2">C2 - Memahami (Understanding)</option>
                               <option value="C3">C3 - Mengaplikasikan (Applying)</option>
                               <option value="C4">C4 - Menganalisis (Analyzing)</option>
                               <option value="C5">C5 - Mengevaluasi (Evaluating)</option>
                               <option value="C6">C6 - Mencipta (Creating)</option>
                           </select>
                       </div>

                       <div className="space-y-2">
                           <label className="text-sm font-medium text-foreground">Kompetensi Dasar (KD)</label>
                           <input type="text" placeholder="Contoh: 3.1" value={kompetensiDasar} onChange={(e) => setKompetensiDasar(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 text-sm" />
                       </div>

                       <div className="pt-2">
                           <label className="flex items-center gap-3 p-3 bg-muted/40 border border-border/60 rounded-md cursor-pointer hover:bg-muted/60 transition-colors">
                               <input type="checkbox" checked={izinkanLampiran} onChange={() => setIzinkanLampiran(!izinkanLampiran)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                               <div className="space-y-0.5">
                                 <p className="text-sm font-medium text-foreground">Izinkan Upload Berkas</p>
                                 <p className="text-[10px] text-muted-foreground whitespace-normal leading-tight">Siswa bisa mengunggah foto hitungan atau PDF sebagai jawaban</p>
                               </div>
                           </label>
                       </div>
                   </div>

                   <button 
                      onClick={handleSimpanEssay} 
                      disabled={isPending}
                      className="w-full flex justify-center items-center gap-2 py-3 bg-secondary text-secondary-foreground rounded-[var(--radius-md)] font-semibold hover:bg-secondary/90 transition-all shadow-md hover-lift"
                   >
                       {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} {editingSoal ? "Update Soal" : "Simpan Soal Uraian"}
                   </button>
               </div>
            </div>
          </div>
      );
  }

  // TAMPILAN LIST SOAL
  return (
    <div className="space-y-6">
        {/* Banner Navigasi */}
        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-[var(--radius-md)] border border-border/50">
           <Link href="/guru/bank-soal" className="p-2 bg-background hover:bg-muted rounded-md transition-colors border border-border"><ArrowLeft className="w-4 h-4 text-muted-foreground"/></Link>
           <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Editor Bank Soal</p>
              <h1 className="text-xl font-bold text-foreground">{bankSoal.nama}</h1>
           </div>
           <div className="ml-auto flex gap-2">
              <span className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent font-medium text-sm rounded-full">{bankSoal.mataPelajaran.nama}</span>
           </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-end border-b border-border pb-4">
            <div>
               <h2 className="text-lg font-bold">Daftar Butir Soal ({bankSoal.soal.length})</h2>
               <p className="text-sm text-muted-foreground">Kelola semua butir pertanyaan di dalam bank soal ini.</p>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={() => { resetForm(); setMode("ADD_ESSAY"); }}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-all font-medium text-sm shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Soal Essay
                </button>
                <button 
                    onClick={() => { resetForm(); setMode("ADD_PG"); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all font-medium text-sm shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Soal Pilihan Ganda
                </button>
            </div>
        </div>

        {/* Tabel Data Soal */}
        <div className="space-y-4">
             {bankSoal.soal.length === 0 ? (
                 <div className="p-12 border border-dashed border-border rounded-[var(--radius-lg)] text-center text-muted-foreground glass">
                     <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                     <p>Belum ada soal di bank soal ini.</p>
                     <p className="text-sm mt-1">Gunakan tombol di atas untuk mulai menyusun pertanyaan.</p>
                 </div>
             ) : (
                 bankSoal.soal.map((s, index) => (
                    <div key={s.id} className="glass rounded-[var(--radius-md)] p-4 relative group">
                        <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm border border-border">{index + 1}</div>
                               <div>
                                   <div className="flex items-center gap-2">
                                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${s.tipe === 'PG' ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'}`}>{s.tipe}</span>
                                       {s.taksonomi && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border/50">{s.taksonomi}</span>}
                                       {s.kompetensiDasar && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border/50">KD: {s.kompetensiDasar}</span>}
                                       <span className="text-[10px] text-muted-foreground">{s.tingkatKesulitan} • Bobot {s.bobot}</span>
                                   </div>
                               </div>
                           </div>
                           
                           <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                               <button onClick={() => handleEditSoal(s)} disabled={isPending} title="Edit Soal" className="p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded transition-colors">
                                   <Edit2 className="w-4 h-4"/>
                               </button>
                               <button onClick={() => handleDeleteSoal(s.id)} disabled={isPending} title="Hapus Soal" className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded transition-colors">
                                   <Trash2 className="w-4 h-4"/>
                               </button>
                           </div>
                        </div>
                        
                        <div className="pl-11 text-foreground whitespace-pre-wrap text-sm leading-relaxed max-w-4xl">
                            {s.teks}
                        </div>

                        {/* Menampilkan Opsi Untuk PG */}
                        {s.tipe === 'PG' && s.opsi && s.opsi.length > 0 && (
                            <div className="mt-4 pl-11 grid grid-cols-1 md:grid-cols-2 gap-2 max-w-4xl">
                                {s.opsi.map((o:any, i:number) => (
                                     <div key={o.id} className={`p-2 rounded border text-sm flex items-start gap-2 ${o.benar ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300' : 'border-border/60 bg-muted/20 text-muted-foreground'}`}>
                                          <div className="font-bold flex-shrink-0">{String.fromCharCode(65 + i)}.</div>
                                          <div>{o.teks}</div>
                                     </div>
                                ))}
                            </div>
                        )}
                    </div>
                 ))
             )}
        </div>
    </div>
  );
}
