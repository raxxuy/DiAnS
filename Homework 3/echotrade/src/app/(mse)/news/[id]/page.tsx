export default async function NewsItem({
  params 
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const news = await fetch(`${process.env.URL}/api/news/${id}`).then(res => res.json());

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white px-4 md:px-8 lg:px-20 py-12">
      {news ? (
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {news.title}
            </h1>
            <div className="flex items-center text-zinc-400 text-sm">
              <time>{new Date(news.date).toLocaleDateString('en-GB')}</time>
              {news.source && (
                <>
                  <span className="mx-2">•</span>
                  <span>{news.source}</span>
                </>
              )}
            </div>
          </header>

          <article className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-zinc-700/30 shadow-xl">
            <div className="prose prose-invert max-w-none">
              {news.content.map((line: string, i: number) => (
                <p key={i} className="text-zinc-100 leading-relaxed mb-6 last:mb-0 whitespace-pre-wrap">
                  {line}
                </p>
              ))}
            </div>
          </article>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-semibold text-zinc-400">News item not found</h2>
          <p className="mt-2 text-zinc-500">The requested article could not be loaded</p>
        </div>
      )}
    </div>
  );
}
