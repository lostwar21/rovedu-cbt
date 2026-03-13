import { getUjianByGuru } from "@/lib/actions/ujian";
import { ClipboardCheck, Users, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PenilaianPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "GURU") {
    redirect("/login");
  }

  const listUjian = await getUjianByGuru();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-primary" /> Penilaian & Hasil Ujian
          </h1>
          <p className="text-muted-foreground text-sm">Pilih ujian untuk melakukan koreksi essay atau melihat hasil pengerjaan siswa.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listUjian.map((ujian) => (
          <div key={ujian.id} className="glass rounded-[var(--radius-lg)] p-6 flex flex-col hover-lift border border-white/10">
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
                  <span>Kelas: {ujian.kelas.map(k => k.nama).join(", ")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Dibuat: {ujian.jadwal[0]?.waktuMulai ? new Date(ujian.jadwal[0].waktuMulai).toLocaleDateString() : "-"}</span>
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
        ))}

        {listUjian.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[var(--radius-lg)]">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Belum ada ujian yang dibuat.</p>
          </div>
        )}
      </div>
    </div>
  );
}
