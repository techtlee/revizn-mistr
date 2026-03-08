export default function Footer() {
  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider text-sm uppercase">Hromosvody Vitmajer</span>
          <span className="hidden sm:inline text-primary-foreground/60">|</span>
          <span className="text-primary-foreground/80 text-xs">Mladá Boleslav</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-primary-foreground/70">
          <span>+420 608 871 132</span>
          <span className="hidden sm:inline">info@vitmajer-hromosvody.cz</span>
        </div>
      </div>
      <div className="bg-black/80 text-center py-2">
        <span className="text-[hsl(44,84%,51%)] text-xs tracking-wider">
          &copy; {new Date().getFullYear()} HROMOSVODY VITMAJER
        </span>
        <span className="text-white/40 text-xs ml-2">
          &bull; Web: <span className="text-white/60">Techtlee</span>
        </span>
      </div>
    </footer>
  );
}
