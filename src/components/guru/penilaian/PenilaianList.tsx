"use client";

import * as React from "react";
import { useState } from "react";
import { ClipboardCheck, Users, Calendar, ArrowRight, Search, Filter } from "lucide-react";
import Link from "next/link";
import { formatWIBDate } from "@/lib/date-utils";

interface PenilaianItem {
  id: string;
  judul: string;
  mataPelajaran: { id: string; nama: string };
  kelas: { id: string; nama: string }[];
  jadwal: { waktuMulai: Date }[];
  _count: { attempts: number };
}

interface Props {
  listUjian: PenilaianItem[];
}

export function PenilaianList({ listUjian }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMapel, setSelectedMapel] = useState<string>("all");

  const filteredUjian = listUjian.filter((u) => {
    const matchesSearch = u.judul.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMapel = selectedMapel === "all" || u.mataPelajaran.id === selectedMapel;
    return matchesSearch && matchesMapel;
  });

  // Get unique Mapel list
  const uniqueMapel = Array.from(new Set(listUjian.map((u) => u.mataPelajaran.id))).map((id) => {
    return listUjian.find((u) => u.mataPelajaran.id === id)?.mataPelajaran;
  });

  return (
    <div className="space-y-6">
      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama ujian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedMapel}
            onChange={(e) => setSelectedMapel(e.target.value)}
            className="flex-1 md:w-60 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {uniqueMapel.map((m) =>
              m ? (
                <option key={m.id} value={m.id}>
                  {m.nama}
                </option>
              ) : null
            )}
          </select>
        </div>

        {(searchQuery || selectedMapel !== "all") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedMapel("all");
            }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium underline underline-offset-4"
          >
            Reset Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUjian.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[var(--radius-lg)]">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">
              {searchQuery || selectedMapel !== "all"
                ? "Tidak ada hasil penilaian yang cocok."
                : "Belum ada ujian yang selesai dikerjakan."}
            </p>
          </div>
        ) : (
          filteredUjian.map((ujian) => (
            <div
              key={ujian.id}
              className="glass rounded-[var(--radius-lg)] p-6 flex flex-col hover-lift border border-white/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                  {ujian._count.attempts} Selesai
                </span>
              </div>

              <div className="mb-6 flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1">{ujian.judul}</h3>
                <p className="text-xs text-muted-foreground mb-4 font-medium">{ujian.mataPelajaran.nama}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>Kelas: {ujian.kelas.map((k) => k.nama).join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Dibuat:{" "}
                      {ujian.jadwal[0]?.waktuMulai
                        ? formatWIBDate(ujian.jadwal[0].waktuMulai, { day: 'numeric', month: 'short', year: 'numeric' })
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={`/guru/penilaian/${ujian.id}`}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all group"
              >
                Koreksi & Detail <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
