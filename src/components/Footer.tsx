export default function Footer() {
  return (
    <footer className="mt-auto bg-[hsl(222,47%,16%)] text-white">
      <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-2 flex items-center justify-between max-w-6xl mx-auto">
        <span className="text-white/80 text-xs font-medium tracking-wider">
          Revizní mistr
        </span>
        <span className="text-white/40 text-xs flex items-center gap-1">
          &copy; Created by <span className="text-white/60 font-medium">Techtlee</span>
        </span>
      </div>
    </footer>
  );
}
