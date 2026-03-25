import { getPengguna } from "@/lib/actions/pengguna";
import { getKelas } from "@/lib/actions/kelas";
import { CetakKartuManager } from "@/components/admin/data-master/CetakKartuManager";

export default async function CetakKartuPage() {
  const dataPengguna = await getPengguna();
  const listKelas = await getKelas();

  return (
    <div className="fade-in">
      <CetakKartuManager data={dataPengguna} listKelas={listKelas} />
    </div>
  );
}
