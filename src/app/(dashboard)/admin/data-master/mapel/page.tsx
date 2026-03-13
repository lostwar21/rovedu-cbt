import { getMataPelajaran } from "@/lib/actions/mapel";
import { MapelTable } from "@/components/admin/data-master/MapelTable";

export default async function MapelPage() {
  const dataMapel = await getMataPelajaran();

  return (
    <div className="fade-in">
      <MapelTable data={dataMapel} />
    </div>
  );
}
