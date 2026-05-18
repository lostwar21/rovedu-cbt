"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Printer, Search, CheckSquare, Square, Filter, Download, Loader2, GraduationCap, UserCircle2, Settings, Save, Image as ImageIcon } from "lucide-react";
import jsPDF from "jspdf";
import { formatWIBDate } from "@/lib/date-utils";

interface UserData {
  id: string;
  name: string | null;
  username: string | null;
  role: string;
  passwordRaw: string | null;
  siswa?: {
    nis: string;
    nomorUjian: string | null;
    kelas: {
      id: string;
      nama: string;
    }
  } | null;
}

interface Kelas {
  id: string;
  nama: string;
  tingkat: number;
}

interface PengaturanKartu {
  id?: string;
  headerInstansi: string;
  headerSekolah: string;
  headerAlamat: string;
  judulKartu: string;
  tahunPelajaran: string;
  tempatTanggal: string;
  jabatanPenandatangan: string;
  namaPenandatangan: string;
  logoUrl: string | null;
  tandaTanganUrl: string | null;
}

interface Props {
  data: UserData[];
  listKelas: Kelas[];
}

export function CetakKartuManager({ data, listKelas }: Props) {
  const [activeTab, setActiveTab] = useState<"CETAK" | "DESAIN">("CETAK");
  
  // Tab Cetak State
  const [filterRole, setFilterRole] = useState<string>("SISWA");
  const [filterKelas, setFilterKelas] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Tab Desain State
  const [pengaturan, setPengaturan] = useState<PengaturanKartu>({
    headerInstansi: "MAJELIS PENDIDIKAN",
    headerSekolah: "MTs AL WASHLIYAH",
    headerAlamat: "Alamat : Jl. Brigjen Rajamin Purba, SH No. 111, Pematangsiantar",
    judulKartu: "KARTU PESERTA UJIAN MADRASAH",
    tahunPelajaran: "TAHUN PELAJARAN 2025/2026",
    tempatTanggal: "Pematangsiantar, 3 Desember 2025",
    jabatanPenandatangan: "Kepala Madrasah,",
    namaPenandatangan: "Dedek Sulaiman, S.Pd.I",
    logoUrl: null,
    tandaTanganUrl: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/pengaturan/kartu');
        if (res.ok) {
          const data = await res.json();
          if (data && data.headerInstansi) setPengaturan(data);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  // Filtering Logic
  const filteredData = data.filter((user) => {
    const matchesRole = user.role === filterRole;
    const matchesKelas = filterRole === "SISWA" 
      ? (filterKelas === "ALL" || user.siswa?.kelas.id === filterKelas)
      : true;
    const matchesSearch = (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.username?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesRole && matchesKelas && matchesSearch;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(u => u.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'tandaTanganUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPengaturan(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PengaturanKartu) => {
    setPengaturan(prev => ({ ...prev, [field]: e.target.value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/pengaturan/kartu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pengaturan)
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      alert("Pengaturan desain kartu berhasil disimpan!");
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = async () => {
    if (selectedIds.length === 0 && activeTab === "CETAK") return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      
      const usersToPrint = activeTab === "DESAIN" 
        ? [{
            id: 'dummy',
            name: 'ABDUL FATHAN',
            username: 'User1146',
            role: 'SISWA',
            passwordRaw: 'Aq3Lo5.o',
            siswa: { nis: '26-02-17-2-0010-0022', kelas: { id: 'k1', nama: 'IX-A' } }
          }] as UserData[]
        : data.filter(u => selectedIds.includes(u.id));
      
      const cardWidth = 90;
      const cardHeight = 65;
      const margin = 10;
      const gap = 5;
      
      let x = margin;
      let y = margin;
      let cardsInPage = 0;

      usersToPrint.forEach((user, index) => {
        if (cardsInPage === 8) {
          doc.addPage();
          x = margin;
          y = margin;
          cardsInPage = 0;
        }

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.rect(x, y, cardWidth, cardHeight);
        
        if (pengaturan.logoUrl) {
           try {
             doc.addImage(pengaturan.logoUrl, 'PNG', x + 3, y + 3, 14, 14);
           } catch(e) {}
        }
        
        doc.setTextColor(0, 100, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(pengaturan.headerInstansi, x + cardWidth / 2 + 5, y + 6, { align: "center" });
        
        doc.setFontSize(12);
        doc.text(pengaturan.headerSekolah, x + cardWidth / 2 + 5, y + 11, { align: "center" });
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text(pengaturan.headerAlamat, x + cardWidth / 2 + 5, y + 15, { align: "center" });

        doc.setDrawColor(0, 100, 0);
        doc.setLineWidth(0.8);
        doc.line(x + 2, y + 18, x + cardWidth - 2, y + 18);
        doc.setLineWidth(0.3);
        doc.line(x + 2, y + 19, x + cardWidth - 2, y + 19);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(pengaturan.judulKartu, x + cardWidth / 2, y + 24, { align: "center" });
        doc.text(pengaturan.tahunPelajaran, x + cardWidth / 2, y + 28, { align: "center" });

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const startY = y + 34;
        const lineSpacing = 4.5;
        
        doc.text("NAMA", x + 5, startY);
        doc.text(":", x + 23, startY);
        doc.text(user.name || "-", x + 25, startY);

        doc.text("NO UJIAN", x + 5, startY + lineSpacing);
        doc.text(":", x + 23, startY + lineSpacing);
        doc.text(user.siswa?.nomorUjian || user.siswa?.nis || "-", x + 25, startY + lineSpacing);

        doc.text("USN", x + 5, startY + lineSpacing * 2);
        doc.text(":", x + 23, startY + lineSpacing * 2);
        doc.text(user.username || "-", x + 25, startY + lineSpacing * 2);

        doc.text("PW", x + 5, startY + lineSpacing * 3);
        doc.text(":", x + 23, startY + lineSpacing * 3);
        doc.text(user.passwordRaw || "-", x + 25, startY + lineSpacing * 3);

        doc.setFontSize(8);
        const rightX = x + cardWidth - 5;
        doc.text(pengaturan.tempatTanggal, rightX, startY + lineSpacing * 4.5, { align: "right" });
        doc.text(pengaturan.jabatanPenandatangan, rightX, startY + lineSpacing * 4.5 + 4, { align: "right" });
        
        if (pengaturan.tandaTanganUrl) {
           try {
             doc.addImage(pengaturan.tandaTanganUrl, 'PNG', rightX - 30, startY + lineSpacing * 4.5 + 5, 20, 10);
           } catch(e) {}
        }
        
        doc.setFont("helvetica", "bold");
        doc.text(pengaturan.namaPenandatangan, rightX, startY + lineSpacing * 4.5 + 18, { align: "right" });

        cardsInPage++;
        if (cardsInPage % 2 === 0) {
          x = margin;
          y += cardHeight + gap;
        } else {
          x += cardWidth + gap;
        }
      });

      if (activeTab === "DESAIN") {
         doc.save('Preview_Kartu_Ujian.pdf');
      } else {
         doc.save(`Kartu_Login_${filterRole}_${formatWIBDate(new Date())}.pdf`);
      }
    } catch (error) {
      console.error("PDF generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-bold text-foreground">Cetak Kartu Login</h2>
           <p className="text-sm text-muted-foreground mt-1">Kelola dan cetak kartu peserta ujian.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("CETAK")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'CETAK' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Printer className="w-4 h-4" /> Daftar Kartu
          </button>
          <button
            onClick={() => setActiveTab("DESAIN")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'DESAIN' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Settings className="w-4 h-4" /> Desain Kartu
          </button>
        </div>
      </div>

      {activeTab === "CETAK" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                 {(["SISWA", "GURU", "PENGAWAS"]).map((r) => (
                   <button
                     key={r}
                     onClick={() => { setFilterRole(r); setSelectedIds([]); }}
                     className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filterRole === r ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                   >
                     {r}
                   </button>
                 ))}
               </div>

               {filterRole === "SISWA" && (
                 <select 
                   value={filterKelas}
                   onChange={(e) => { setFilterKelas(e.target.value); setSelectedIds([]); }}
                   className="bg-muted/50 border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                 >
                   <option value="ALL">Semua Kelas</option>
                   {listKelas.map(k => (
                     <option key={k.id} value={k.id}>{k.nama}</option>
                   ))}
                 </select>
               )}

               <div className="relative flex-1 min-w-[200px]">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input 
                   type="text"
                   placeholder="Search nama atau username..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                 />
               </div>
            </div>

            <button
              onClick={generatePDF}
              disabled={selectedIds.length === 0 || isGenerating}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all hover-lift font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              Cetak {selectedIds.length} Kartu
            </button>
          </div>

          <div className="glass rounded-2xl overflow-hidden border border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-4 px-6 w-10">
                       <button onClick={toggleSelectAll} className="hover:text-primary transition-colors">
                         {selectedIds.length === filteredData.length && filteredData.length > 0 ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                       </button>
                    </th>
                    <th className="py-4 px-6 font-bold">Pengguna</th>
                    <th className="py-4 px-6 font-bold">Info Card</th>
                    <th className="py-4 px-6 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-muted-foreground italic">
                        Tidak ada data yang cocok dengan filter Anda.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((user) => {
                      const isSelected = selectedIds.includes(user.id);
                      return (
                        <tr 
                          key={user.id} 
                          onClick={() => toggleSelect(user.id)}
                          className={`border-b border-border/50 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                        >
                          <td className="py-4 px-6">
                             <div className={`transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                               {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                             </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${user.role === 'SISWA' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                                 {user.name?.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-foreground">{user.name}</div>
                                <div className="text-[10px] text-muted-foreground">@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                             <div className="flex items-center gap-2">
                                {user.role === 'SISWA' ? <GraduationCap className="w-4 h-4 text-primary" /> : <UserCircle2 className="w-4 h-4 text-accent" />}
                                <span className="text-xs font-medium">
                                   {user.role === 'SISWA' ? `${user.siswa?.kelas.nama || '-'} • NIS: ${user.siswa?.nis || '-'}` : user.role}
                                </span>
                             </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                             <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                             <span className="text-[10px] font-bold text-muted-foreground uppercase">Akun Aktif</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "DESAIN" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="glass rounded-2xl p-6 border border-border/50">
              <h3 className="text-lg font-bold text-foreground mb-4">Form Pengaturan Desain</h3>
              {isLoadingSettings ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-muted-foreground">Header Instansi</label>
                       <input 
                         type="text" 
                         value={pengaturan.headerInstansi} 
                         onChange={(e) => handleSettingChange(e, 'headerInstansi')}
                         className="w-full px-3 py-2 bg-muted/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                       />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-muted-foreground">Header Sekolah</label>
                       <input 
                         type="text" 
                         value={pengaturan.headerSekolah} 
                         onChange={(e) => handleSettingChange(e, 'headerSekolah')}
                         className="w-full px-3 py-2 bg-muted/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                       />
                     </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Alamat Sekolah</label>
                    <input 
                      type="text" 
                      value={pengaturan.headerAlamat} 
                      onChange={(e) => handleSettingChange(e, 'headerAlamat')}
                      className="w-full px-3 py-2 bg-muted/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-muted-foreground">Judul Kartu</label>
                       <input 
                         type="text" 
                         value={pengaturan.judulKartu} 
                         onChange={(e) => handleSettingChange(e, 'judulKartu')}
                         className="w-full px-3 py-2 bg-muted/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                       />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-muted-foreground">Tahun Pelajaran</label>
                       <input 
                         type="text" 
                         value={pengaturan.tahunPelajaran} 
                         onChange={(e) => handleSettingChange(e, 'tahunPelajaran')}
                         className="w-full px-3 py-2 bg-muted/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                       />
                     </div>
                  </div>

                  <hr className="border-border/50 my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-muted-foreground">Tempat & Tanggal (TTD)</label>
                       <input 
                         type="text" 
                         value={pengaturan.tempatTanggal} 
                         onChange={(e) => handleSettingChange(e, 'tempatTanggal')}
                         className="w-full px-3 py-2 bg-muted/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                       />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-muted-foreground">Jabatan Penandatangan</label>
                       <input 
                         type="text" 
                         value={pengaturan.jabatanPenandatangan} 
                         onChange={(e) => handleSettingChange(e, 'jabatanPenandatangan')}
                         className="w-full px-3 py-2 bg-muted/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                       />
                     </div>
                     <div className="space-y-1.5 md:col-span-2">
                       <label className="text-xs font-bold text-muted-foreground">Nama Penandatangan</label>
                       <input 
                         type="text" 
                         value={pengaturan.namaPenandatangan} 
                         onChange={(e) => handleSettingChange(e, 'namaPenandatangan')}
                         className="w-full px-3 py-2 bg-muted/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                       />
                     </div>
                  </div>

                  <hr className="border-border/50 my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-muted-foreground">Upload Logo Sekolah</label>
                       <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'logoUrl')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex items-center justify-center gap-2 w-full px-3 py-4 bg-muted/50 border-2 border-dashed border-primary/30 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors">
                             <ImageIcon className="w-4 h-4" />
                             <span className="font-medium">Pilih Gambar Logo</span>
                          </div>
                       </div>
                       {pengaturan.logoUrl && <div className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1"><CheckSquare className="w-3 h-3"/> Logo terisi</div>}
                     </div>

                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-muted-foreground">Upload Tanda Tangan / Stempel</label>
                       <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'tandaTanganUrl')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex items-center justify-center gap-2 w-full px-3 py-4 bg-muted/50 border-2 border-dashed border-primary/30 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors">
                             <ImageIcon className="w-4 h-4" />
                             <span className="font-medium">Pilih Gambar TTD</span>
                          </div>
                       </div>
                       {pengaturan.tandaTanganUrl && <div className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1"><CheckSquare className="w-3 h-3"/> TTD terisi</div>}
                     </div>
                  </div>

                  <div className="pt-4 flex flex-wrap items-center justify-end gap-3">
                     <button
                        onClick={generatePDF}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-5 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all font-bold"
                     >
                       {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                       Test Print (PDF)
                     </button>
                     <button
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20"
                     >
                       {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                       Simpan Desain
                     </button>
                  </div>
                </div>
              )}
           </div>

           <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Preview Tampilan Visual</h3>
              <p className="text-xs text-muted-foreground">Tampilan ini merupakan pendekatan dari hasil PDF sesungguhnya.</p>
              <div className="glass rounded-2xl p-6 border border-border/50 flex items-center justify-center bg-muted/20 min-h-[400px]">
                 <div className="bg-white border border-gray-400 w-[340px] h-[260px] p-4 text-black relative shadow-xl font-sans">
                    <div className="flex items-start">
                       <div className="w-[50px] h-[50px] flex-shrink-0 flex items-center justify-center mr-2">
                         {pengaturan.logoUrl ? (
                            <img src={pengaturan.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                         ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 text-center">No Logo</div>
                         )}
                       </div>
                       <div className="flex-1 text-center">
                          <div className="text-[#006400] text-[11px] font-bold leading-tight">{pengaturan.headerInstansi}</div>
                          <div className="text-[#006400] text-[13px] font-bold leading-tight mt-0.5">{pengaturan.headerSekolah}</div>
                          <div className="text-gray-800 text-[8px] leading-tight mt-1">{pengaturan.headerAlamat}</div>
                       </div>
                    </div>
                    
                    <div className="border-b-[3px] border-[#006400] mt-2 w-full"></div>
                    <div className="border-b border-[#006400] mt-[2px] w-full mb-2"></div>
                    
                    <div className="text-center font-bold text-[11px] leading-tight mt-1">{pengaturan.judulKartu}</div>
                    <div className="text-center font-bold text-[11px] leading-tight">{pengaturan.tahunPelajaran}</div>

                    <div className="mt-3 text-[10px] space-y-1 pl-2">
                       <div className="flex"><div className="w-[70px]">NAMA</div><div className="w-[10px]">:</div><div className="font-medium">ABDUL FATHAN</div></div>
                       <div className="flex"><div className="w-[70px]">NO UJIAN</div><div className="w-[10px]">:</div><div className="font-medium">26-02-17-2-0010-0022</div></div>
                       <div className="flex"><div className="w-[70px]">USN</div><div className="w-[10px]">:</div><div className="font-medium">User1146</div></div>
                       <div className="flex"><div className="w-[70px]">PW</div><div className="w-[10px]">:</div><div className="font-medium">Aq3Lo5.o</div></div>
                    </div>

                    <div className="absolute bottom-4 right-4 text-right text-[9px] leading-tight w-[140px]">
                       <div>{pengaturan.tempatTanggal}</div>
                       <div className="mt-0.5">{pengaturan.jabatanPenandatangan}</div>
                       <div className="h-[40px] flex items-center justify-end mt-1 mb-1 relative">
                          {pengaturan.tandaTanganUrl && (
                             <img src={pengaturan.tandaTanganUrl} alt="TTD" className="h-[30px] object-contain mr-6" />
                          )}
                       </div>
                       <div className="font-bold">{pengaturan.namaPenandatangan}</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
