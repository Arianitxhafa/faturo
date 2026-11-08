// Shown instantly while an app page loads its data on the server.
import { getTr } from "@/i18n/server";

export default async function Loading() {
  const tr = await getTr();
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6" aria-busy="true" aria-label={tr("Loading")}>
      <div className="grid gap-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-11 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-72 rounded-2xl" />
    </div>
  );
}
