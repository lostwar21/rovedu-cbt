import { getJawabanSiswaForScoring } from "@/lib/actions/sesi";
import { prisma } from "@/lib/prisma";
import { LembarJawabSiswa } from "@/components/guru/LembarJawabSiswa";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChevronLeft, User, Mail, GraduationCap } from "lucide-react";
import Link from "next/link";

export default async function SesiScoringPage({ 
  params 
}: { 
  params: Promise<{ sesiId: string }> 
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "GURU") {
    redirect("/login");
  }

  const { sesiId } = await params;

  const sesi = await prisma.sesiUjian.findUnique({
    where: { id: sesiId },
    include: {
      siswa: {
        include: {
          user: { select: { name: true } },
          kelas: true
        }
      },
      ujian: true,
      hasil: true
    }
  });

  if (!sesi) redirect("/guru/penilaian");

  const jawaban = await getJawabanSiswaForScoring(sesiId);

  return (
    <div className="space-y-6">
      {/* Header Info Siswa */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/guru/penilaian/${sesi.ujianId}`} 
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black">{sesi.siswa.user.name}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium mt-1">
                <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {sesi.siswa.kelas.nama}</span>
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> NIS: {sesi.siswa.nis}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2">
            Status: {sesi.status}
          </div>
          <p className="text-xs text-muted-foreground font-medium">Ujian: <span className="text-foreground font-bold">{sesi.ujian.judul}</span></p>
        </div>
      </div>

      <LembarJawabSiswa sesi={sesi} jawaban={jawaban} />
    </div>
  );
}
