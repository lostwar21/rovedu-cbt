import { getUjianByGuru } from "@/lib/actions/ujian";
import { ClipboardCheck } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PenilaianList } from "@/components/guru/penilaian/PenilaianList";

export default async function PenilaianPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "GURU" && session.user.role !== "ADMIN")) {
    return <div className="p-8 text-center text-muted-foreground">Akses Ditolak.</div>;
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

      <PenilaianList listUjian={listUjian as any} />
    </div>
  );
}
