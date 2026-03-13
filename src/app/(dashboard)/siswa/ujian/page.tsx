import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDaftarUjianSiswa } from "@/lib/actions/siswa-ujian";
import { DaftarUjianSiswa } from "@/components/siswa/DaftarUjianSiswa";

export default async function SiswaUjianPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "SISWA") {
    return redirect("/login");
  }

  const data = await getDaftarUjianSiswa();

  if ("error" in data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {data.error}
      </div>
    );
  }

  return (
    <div className="fade-in max-w-5xl mx-auto">
      <DaftarUjianSiswa data={data as any} />
    </div>
  );
}
