import { getTahunAjaran } from "@/lib/actions/tahun-ajaran";
import { TahunAjaranTable } from "@/components/admin/tahun-ajaran/TahunAjaranTable";

export default async function TahunAjaranPage() {
  const data = await getTahunAjaran();

  return (
    <div className="fade-in">
      <TahunAjaranTable data={data} />
    </div>
  );
}
