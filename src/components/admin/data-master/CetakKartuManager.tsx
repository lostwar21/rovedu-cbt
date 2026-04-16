"use client";

import * as React from "react";
import { useState } from "react";
import { Printer, Search, CheckSquare, Square, Filter, Download, Loader2, GraduationCap, UserCircle2 } from "lucide-react";
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

interface Props {
  data: UserData[];
  listKelas: Kelas[];
}

export function CetakKartuManager({ data, listKelas }: Props) {
  const [filterRole, setFilterRole] = useState<string>("SISWA");
  const [filterKelas, setFilterKelas] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const generatePDF = async () => {
    if (selectedIds.length === 0) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const selectedUsers = data.filter(u => selectedIds.includes(u.id));
      
      const cardWidth = 85;
      const cardHeight = 55;
      const margin = 10;
      const gap = 5;
      
      let x = margin;
      let y = margin;
      let cardsInPage = 0;

      selectedUsers.forEach((user, index) => {
        if (cardsInPage === 10) { // 2 columns, 5 rows
          doc.addPage();
          x = margin;
          y = margin;
          cardsInPage = 0;
        }

        // Draw Card Border
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3);
        
        // Header
        doc.setFillColor(79, 70, 229); // Primary Color
        doc.roundedRect(x, y, cardWidth, 12, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("ROVEDU CBT", x + cardWidth / 2, y + 8, { align: "center" });
        
        // Content
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("KARTU LOGIN UJAN", x + cardWidth / 2, y + 18, { align: "center" });

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Nama: ${user.name || "-"}`, x + 5, y + 26);
        doc.text(`Username: ${user.username || "-"}`, x + 5, y + 32);
        doc.text(`Password: ${user.passwordRaw || "rahasia123"}`, x + 5, y + 38);
        
        if (user.role === "SISWA" && user.siswa) {
          doc.text(`Kelas: ${user.siswa.kelas.nama}`, x + 5, y + 44);
          doc.text(`NIS: ${user.siswa.nis}`, x + 5, y + 50);
        }

        // Footer note
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Simpan kartu ini untuk login ujian.", x + cardWidth - 5, y + cardHeight - 3, { align: "right" });

        // Update positions
        cardsInPage++;
        if (cardsInPage % 2 === 0) {
          x = margin;
          y += cardHeight + gap;
        } else {
          x += cardWidth + gap;
        }
      });

      doc.save(`Kartu_Login_${filterRole}_${formatWIBDate(new Date())}.pdf`);
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
           <p className="text-sm text-muted-foreground mt-1">Pilih pengguna untuk mencetak kartu login saku.</p>
        </div>
        
        <button
          onClick={generatePDF}
          disabled={selectedIds.length === 0 || isGenerating}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all hover-lift font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
          Cetak {selectedIds.length} Kartu
        </button>
      </div>

      {/* Filters */}
      <div className="glass p-4 rounded-2xl flex flex-wrap items-center gap-4">
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

      {/* Table / Grid */}
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
  );
}
