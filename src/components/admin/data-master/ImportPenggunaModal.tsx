"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import {
  X,
  Upload,
  Loader2,
  Download,
  AlertCircle,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { importPenggunaAction } from "@/lib/actions/pengguna";
import { useRouter } from "next/navigation";

interface Props {
  onClose: () => void;
}

interface ParsedUser {
  name: string;
  username: string;
  password?: string;
  nis?: string;
  nip?: string;
  kelas?: string;
  role: "SISWA" | "GURU" | "PENGAWAS";
  mataPelajaran?: string;
}

export function ImportPenggunaModal({ onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [parsedData, setParsedData] = useState<ParsedUser[] | null>(null);
  const [fileName, setFileName] = useState("");

  const handleDownloadTemplate = () => {
    const csvContent = [
      ["No", "Nama", "NIS / NIP", "Username", "Password", "Role (SISWA/GURU/PENGAWAS)", "Kelas (Untuk Siswa)", "Mata Pelajaran (Untuk Guru, pisah koma)"],
      [1, "Budi Santoso", "12345", "budi123", "pass123", "SISWA", "X-IPA-1", ""],
      [2, "Siti Aminah", "19800101", "siti_guru", "guru123", "GURU", "", "Matematika, Fisika"],
      [3, "Joko Pengawas", "", "joko_p", "pengawas123", "PENGAWAS", "", ""],
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Template_Import_User.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccess("");
    setParsedData(null);

    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      import("xlsx").then((xlsx) => {
        try {
          const data = evt.target?.result;
          const wb = xlsx.read(data, { type: "array" });
          const sheetName = wb.SheetNames[0];
          const sheet = wb.Sheets[sheetName];
          const jsonData = xlsx.utils.sheet_to_json<any>(sheet, { defval: "" });

          if (!jsonData || jsonData.length === 0) {
            setError("File kosong atau tidak terbaca.");
            return;
          }

          const processed: ParsedUser[] = jsonData.map((row: any, i: number) => {
            const roleInput = String(row["Role (SISWA/GURU/PENGAWAS)"] || row["Role"] || "").toUpperCase();
            const role: any = ["SISWA", "GURU", "PENGAWAS"].includes(roleInput) ? roleInput : "SISWA";
            
            return {
              name: String(row["Nama"] || "").trim(),
              username: String(row["Username"] || "").trim(),
              password: String(row["Password"] || "").trim(),
              nis: String(row["NIS / NIP"] || row["NIS"] || "").trim(),
              nip: String(row["NIS / NIP"] || row["NIP"] || "").trim(),
              kelas: String(row["Kelas (Untuk Siswa)"] || row["Kelas"] || "").trim(),
              role,
              mataPelajaran: String(row["Mata Pelajaran (Untuk Guru, pisah koma)"] || row["Mata Pelajaran"] || "").trim(),
            };
          });

          // Validasi minimal di client
          const invalid = processed.filter(u => !u.name || !u.username);
          if (invalid.length > 0) {
            setError(`Ditemukan ${invalid.length} data dengan Nama atau Username kosong.`);
          }

          setParsedData(processed);
        } catch (err: any) {
          setError("Gagal membaca file: " + err.message);
        }
      });
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImport = () => {
    if (!parsedData || parsedData.length === 0) return;

    startTransition(async () => {
      try {
        setError("");
        const result = await importPenggunaAction(parsedData);
        setSuccess(`${result.success} user berhasil diimpor!`);
        if (result.failed > 0) {
          setError(`Gagal: ${result.failed}. Detail: ${result.errors.slice(0, 3).join(", ")}`);
        }
        setTimeout(() => {
          if (result.failed === 0) onClose();
          router.refresh();
        }, 2000);
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan sistem saat import.");
      }
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Import Pengguna Massal"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-start gap-2 border border-destructive/20 active:scale-95 transition-all">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="whitespace-pre-wrap">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-500/10 text-emerald-600 text-sm rounded-lg flex items-center gap-2 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-primary text-sm">1. Download Template</h4>
            <p className="text-xs text-muted-foreground">Isi data Nama, Username, dan Password (Kartu Ujian).</p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="p-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors shadow-sm"
            title="Download Template"
          >
            <Download className="w-5 h-5 text-primary" />
          </button>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-sm">2. Unggah File</h4>
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 transition-all relative group">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="space-y-3 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm">
                  {fileName ? fileName : "Pilih file Excel atau CSV"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Maksimum 2000 data per unggahan</p>
              </div>
            </div>
          </div>
        </div>

        {parsedData && (
          <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{parsedData.length} calon pengguna ditemukan</span>
            </div>
            <button 
                onClick={handleImport}
                disabled={isPending || !!success}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Mulai Import Sekarang"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
