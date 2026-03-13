import { getRuangan } from "@/lib/actions/ruangan";
import { RuanganTable } from "@/components/admin/data-master/RuanganTable";

export default async function RuanganPage() {
  const dataRuangan = await getRuangan();

  return (
    <div className="fade-in">
      <RuanganTable data={dataRuangan} />
    </div>
  );
}
