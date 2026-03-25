"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import {
  X,
  Upload,
  Loader2,
  Download,
  AlertCircle,
  Image as ImageIcon,
  Video,
  CheckCircle2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { importSoalExcelAction } from "@/lib/actions/bank-soal-import";
import { useRouter } from "next/navigation";

interface Props {
  bankSoalId: string;
  onClose: () => void;
}

interface ParsedRow {
  teks: string;
  tipe: "PG";
  bobot: number;
  tingkatKesulitan: "MUDAH" | "SEDANG" | "SULIT";
  taksonomi: string;
  kompetensiDasar: string;
  acakOpsi: boolean;
  gambar: string | null;
  opsi: { teks: string; benar: boolean }[];
}

export function ImportSoalModal({ bankSoalId, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [parsedData, setParsedData] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState("");

  // Buat template Excel menggunakan format CSV sederhana yang didownload langsung
  const handleDownloadTemplate = () => {
    const csvContent = [
      ["No", "Pertanyaan", "Gambar (URL)", "Video YouTube (URL)", "Opsi A", "Opsi B", "Opsi C", "Opsi D", "Opsi E", "Kunci Jawaban (A/B/C/D/E)"],
      [1, "Berapa hasil dari 1+1?", "", "", "1", "2", "3", "4", "5", "B"],
      [2, "Contoh soal dengan gambar. Hewan apa ini?", "https://example.com/kucing.jpg", "", "Anjing", "Kucing", "Burung", "Ikan", "", "B"],
      [3, "Tonton video berikut, reagen apa yang digunakan?", "", "https://youtu.be/dQw4w9WgXcQ", "H2O", "CO2", "NaCl", "HCl", "NaOH", "A"],
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Rovedu_Template_Soal.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let inQuote = false;
      let cell = "";
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuote = !inQuote;
        } else if (ch === "," && !inQuote) {
          result.push(cell.trim());
          cell = "";
        } else {
          cell += ch;
        }
      }
      result.push(cell.trim());
      return result;
    };

    const headers = parseRow(lines[0]);
    return lines.slice(1).map((line) => {
      const cells = parseRow(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = cells[i] ?? "";
      });
      return obj;
    });
  };

  const processRow = (row: Record<string, string>, index: number): ParsedRow => {
    const pertanyaan = row["Pertanyaan"]?.trim();
    const opsiA = row["Opsi A"]?.trim();
    const opsiB = row["Opsi B"]?.trim();
    const kunciRaw = row["Kunci Jawaban (A/B/C/D/E)"]?.trim().toUpperCase() || 
                     row["Kunci Jawaban"]?.trim().toUpperCase() || "";

    if (!pertanyaan) throw new Error(`Baris ${index + 2}: Kolom "Pertanyaan" kosong.`);
    if (!opsiA || !opsiB) throw new Error(`Baris ${index + 2}: "Opsi A" dan "Opsi B" wajib diisi.`);
    if (!["A", "B", "C", "D", "E"].includes(kunciRaw))
      throw new Error(`Baris ${index + 2}: "Kunci Jawaban" harus berupa A, B, C, D, atau E. Ditemukan: "${kunciRaw}"`);

    // Injeksi YouTube jika ada
    const ytUrl = row["Video YouTube (URL)"]?.trim();
    let finalTeks = pertanyaan;
    if (ytUrl) {
      const ytMatch = ytUrl.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*).*/
      );
      const videoId = ytMatch && ytMatch[1].length === 11 ? ytMatch[1] : null;
      if (videoId) {
        finalTeks =
          `<div class="mb-4 aspect-video w-full rounded-xl overflow-hidden border border-border shadow-sm">` +
          `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" ` +
          `title="YouTube video player" frameborder="0" ` +
          `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` +
          `</div>\n${pertanyaan}`;
      }
    }

    // Rakit opsi
    const opsiArr: { teks: string; benar: boolean }[] = [];
    const keys = ["A", "B", "C", "D", "E"];
    for (const k of keys) {
      const val = row[`Opsi ${k}`]?.trim();
      if (val) {
        opsiArr.push({ teks: val, benar: kunciRaw === k });
      }
    }
    if (!opsiArr.some((o) => o.benar))
      throw new Error(`Baris ${index + 2}: Kunci Jawaban "${kunciRaw}" tidak cocok dengan opsi yang ada.`);

    return {
      teks: finalTeks,
      tipe: "PG",
      bobot: 1,
      tingkatKesulitan: "SEDANG",
      taksonomi: "",
      kompetensiDasar: "",
      acakOpsi: true,
      gambar: row["Gambar (URL)"]?.trim() || null,
      opsi: opsiArr,
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccess("");
    setParsedData(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const isCSV = file.name.endsWith(".csv");
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (!isCSV && !isExcel) {
      setError("Format tidak didukung. Gunakan file .csv, .xlsx, atau .xls.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        let rawRows: Record<string, string>[];

        if (isCSV) {
          const text = evt.target?.result as string;
          rawRows = parseCSV(text);
        } else {
          // Gunakan dynamic import untuk xlsx
          import("xlsx").then((xlsx) => {
            try {
              const data = evt.target?.result;
              const wb = xlsx.read(data, { type: "array" });
              const sheetName = wb.SheetNames[0];
              const sheet = wb.Sheets[sheetName];
              const jsonData = xlsx.utils.sheet_to_json<Record<string, string>>(sheet, {
                defval: "",
                raw: false,
              });

              if (!jsonData || jsonData.length === 0) {
                setError("File Excel kosong atau tidak terbaca.");
                return;
              }

              const processed: ParsedRow[] = [];
              const errors: string[] = [];
              jsonData.forEach((row, i) => {
                try {
                  processed.push(processRow(row, i));
                } catch (e: any) {
                  errors.push(e.message);
                }
              });

              if (errors.length > 0) {
                setError(`Ditemukan ${errors.length} baris bermasalah:\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? `\n...dan ${errors.length - 3} lainnya` : ""}`);
              }
              if (processed.length > 0) {
                setParsedData(processed);
              }
            } catch (err: any) {
              setError("Gagal membaca file Excel: " + (err.message || "File rusak."));
            }
          });
          return; // exit early, handled in .then()
        }

        if (!rawRows || rawRows.length === 0) {
          setError("File kosong atau format tidak sesuai template.");
          return;
        }

        const processed: ParsedRow[] = [];
        const errors: string[] = [];
        rawRows.forEach((row, i) => {
          try {
            processed.push(processRow(row, i));
          } catch (e: any) {
            errors.push(e.message);
          }
        });

        if (errors.length > 0) {
          setError(`Ditemukan ${errors.length} baris bermasalah:\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? `\n...dan ${errors.length - 3} lainnya` : ""}`);
        }
        if (processed.length > 0) {
          setParsedData(processed);
        }
      } catch (err: any) {
        setError("Gagal memproses file: " + (err.message || "Terjadi kesalahan."));
      }
    };

    reader.onerror = () => setError("Gagal membaca file.");

    if (isCSV) {
      reader.readAsText(file, "UTF-8");
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleImport = () => {
    if (!parsedData || parsedData.length === 0) {
      setError("Tidak ada data yang valid untuk diimpor.");
      return;
    }

    startTransition(async () => {
      try {
        setError("");
        const result = await importSoalExcelAction(bankSoalId, parsedData);
        if (result?.success) {
          setSuccess(`${result.count} soal berhasil diimpor!`);
          setTimeout(() => {
            router.refresh();
            onClose();
          }, 1500);
        }
      } catch (err: any) {
        setError(err.message || "Gagal mengimpor soal.");
      }
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Import Soal via File"
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Error */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-start gap-2 border border-destructive/20 whitespace-pre-wrap animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="p-3 bg-emerald-500/10 text-emerald-600 text-sm rounded-lg flex items-center gap-2 border border-emerald-500/20 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Download Template */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="space-y-1">
            <h4 className="font-semibold text-primary">1. Download Template CSV</h4>
            <p className="text-xs text-muted-foreground">
              Isi soal sesuai format template. Simpan sebagai .csv atau .xlsx.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> URL Gambar
              </span>
              <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                <Video className="w-3 h-3" /> Auto-embed YouTube
              </span>
            </div>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 bg-background border border-border shadow-sm hover:bg-muted rounded-lg text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors"
          >
            <Download className="w-4 h-4" /> Template .csv
          </button>
        </div>

        {/* Upload Box */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground text-sm">2. Unggah File yang Sudah Diisi</h4>
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 transition-colors relative group">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {parsedData ? (
              <div className="space-y-3 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-emerald-600">File Siap Diimpor!</p>
                  <p className="text-sm font-medium text-foreground mt-1">{fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {parsedData.length} soal valid ditemukan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Klik atau Seret File di Sini</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format yang didukung: .csv, .xlsx, .xls
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        {parsedData && parsedData.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-sm">
              Preview ({parsedData.length} soal)
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {parsedData.map((row, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-muted/40 rounded-lg border border-border/50 text-xs"
                >
                  <span className="font-semibold text-foreground">#{i + 1}</span>{" "}
                  <span className="text-muted-foreground line-clamp-1">
                    {row.teks.replace(/<[^>]+>/g, "").trim()}
                  </span>
                  <span className="ml-2 text-[10px] text-primary">
                    ({row.opsi.length} opsi)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors border border-border"
          >
            Batal
          </button>
          <button
            disabled={!parsedData || parsedData.length === 0 || isPending || !!success}
            onClick={handleImport}
            className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sedang Menyimpan...
              </>
            ) : (
              `Mulai Import ${parsedData ? `(${parsedData.length} soal)` : ""}`
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
