import { getPengguna } from "@/lib/actions/pengguna";
import { getKelas } from "@/lib/actions/kelas";
import { getMataPelajaran } from "@/lib/actions/mapel";
import { PenggunaTable } from "@/components/admin/data-master/PenggunaTable";

export default async function PenggunaPage() {
  const dataPengguna = await getPengguna();
  const listKelas = await getKelas();
  const listMapel = await getMataPelajaran();

  return (
    <div className="fade-in">
      <PenggunaTable data={dataPengguna} listKelas={listKelas} listMapel={listMapel} />
    </div>
  );
}
