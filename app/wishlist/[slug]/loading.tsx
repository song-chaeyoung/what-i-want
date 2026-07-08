export default function PublicWishlistLoading() {
  return (
    <main className="pub-page min-h-dvh">
      <header className="pub-header">
        <div className="mx-auto w-full max-w-6xl animate-pulse px-5 py-8 sm:px-8 lg:py-12">
          <div className="h-8 w-48 rounded bg-black/10" />
          <div className="mt-3 h-4 w-64 rounded bg-black/10" />
        </div>
      </header>
      <section className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 lg:py-8">
        <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="pub-card h-48" />
          ))}
        </div>
      </section>
    </main>
  );
}
