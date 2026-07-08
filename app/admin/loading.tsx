export default function AdminLoading() {
  return (
    <section className="space-y-4">
      <div className="grid animate-pulse divide-y divide-line overflow-hidden rounded-md border border-line bg-white sm:auto-cols-fr sm:grid-flow-col sm:divide-x sm:divide-y-0">
        {[0, 1, 2].map((index) => (
          <div key={index} className="min-w-0 px-3.5 py-3">
            <div className="h-3 w-12 rounded bg-zinc-200" />
            <div className="mt-2 h-6 w-20 rounded bg-zinc-200" />
            <div className="mt-2 h-3 w-24 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
      <div className="h-16 animate-pulse rounded-md border border-line bg-white" />
      <div className="h-40 animate-pulse rounded-md border border-line bg-white" />
    </section>
  );
}
