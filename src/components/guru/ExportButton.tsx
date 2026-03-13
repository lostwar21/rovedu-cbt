"use client";

import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  data: any[];
  filename: string;
}

export function ExportButton({ data, filename }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const exportToExcel = () => {
    const headers = ["Nama Siswa", "NIS", "Kelas", "Status", "Jawaban Terisi", "Nilai PG", "Nilai Essay", "Nilai Total"];
    
    const rows = data.map(s => [
      s.siswa?.user?.name || "-",
      s.siswa?.nis || "-",
      s.siswa?.kelas?.nama || "-",
      s.status,
      s._count?.jawaban || 0,
      s.hasil?.nilaiPg || 0,
      s.hasil?.nilaiEssay || 0,
      s.hasil?.nilaiTotal || 0,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil Ujian");
    
    // Auto-width columns
    const max_widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i]).length)) + 2);
    worksheet["!cols"] = max_widths.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, `${filename}.xlsx`);
    setIsOpen(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = filename.replace(/_/g, " ");
    
    doc.setFontSize(18);
    doc.text("Laporan Hasil Ujian - Rovedu CBT", 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(title, 14, 30);
    doc.text(`Dicetak pada: ${new Date().toLocaleString()}`, 14, 38);

    const headers = [["No", "Nama Siswa", "NIS", "Kelas", "Status", "PG", "Essay", "Total"]];
    const rows = data.map((s, idx) => [
      idx + 1,
      s.siswa?.user?.name || "-",
      s.siswa?.nis || "-",
      s.siswa?.kelas?.nama || "-",
      s.status,
      s.hasil?.nilaiPg || 0,
      s.hasil?.nilaiEssay || 0,
      s.hasil?.nilaiTotal || 0,
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 15 },
      }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.getWidth() - 35, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save(`${filename}.pdf`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md group border border-white/10"
      >
        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
        Ekspor Hasil
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 glass rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 space-y-1">
            <button
              onClick={exportToExcel}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors text-left"
            >
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              Excel Native (.xlsx)
            </button>
            <button
              onClick={exportToPDF}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
            >
              <div className="p-1.5 bg-rose-500/10 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              PDF Document (.pdf)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
