// Shown instantly while an app page loads its data on the server.
export default function Loading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6" aria-busy="true" aria-label="Loading">
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
