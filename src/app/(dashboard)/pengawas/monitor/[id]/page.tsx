import { MonitorUjian } from "@/components/pengawas/MonitorUjian";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function MonitorPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "PENGAWAS" && session.user.role !== "GURU" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/pengawas" 
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Monitor Ruangan</h1>
          <p className="text-xs text-muted-foreground">Monitoring pengerjaan siswa secara real-time</p>
        </div>
      </div>

      <MonitorUjian jadwalId={id} />
    </div>
  );
}
