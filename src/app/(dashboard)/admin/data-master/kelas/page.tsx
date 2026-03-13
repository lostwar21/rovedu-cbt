import { getKelas } from "@/lib/actions/kelas";
import { getTahunAjaran } from "@/lib/actions/tahun-ajaran";
import { KelasTable } from "@/components/admin/data-master/KelasTable";

export default async function KelasPage() {
  const dataKelas = await getKelas();
  const listTahunAjaran = await getTahunAjaran();

  return (
    <div className="fade-in">
      <KelasTable data={dataKelas} listTahunAjaran={listTahunAjaran} />
    </div>
  );
}
