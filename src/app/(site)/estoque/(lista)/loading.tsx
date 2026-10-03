export default function Loading() {
  return (
    <div
      className="container-page pt-8 pb-8 md:pt-10"
      aria-busy="true"
      aria-label="Carregando veículos"
    >
      <div className="mb-8 flex flex-col gap-3">
        <div className="h-4 w-32 rounded-ui bg-surface-2" />
        <div className="h-12 w-56 rounded-ui bg-surface-2" />
        <div className="h-5 w-48 rounded-ui bg-surface-2" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[17.5rem_minmax(0,1fr)] xl:gap-14">
        <div className="hidden flex-col gap-3 lg:flex">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-11 rounded-ui bg-surface-2" />
          ))}
        </div>
        <ul className="grid gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex flex-col gap-3">
              <div className="aspect-[4/3] animate-pulse rounded-ui bg-surface-2 motion-reduce:animate-none" />
              <div className="h-4 w-20 rounded-ui bg-surface-2" />
              <div className="h-5 w-3/4 rounded-ui bg-surface-2" />
              <div className="h-4 w-2/3 rounded-ui bg-surface-2" />
              <div className="h-6 w-28 rounded-ui bg-surface-2" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
