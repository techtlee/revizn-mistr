export default function WaveBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div className="absolute bottom-0 left-0 right-0 h-[40vh] min-h-[200px]">
        <svg
          className="absolute bottom-0 w-[200%] h-full animate-wave-slow"
          style={{ left: "-50%" }}
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            fill="hsl(221 83% 53% / 0.06)"
            d="M0,100 C300,50 600,150 900,100 C1050,75 1200,125 1200,100 L1200,200 L0,200 Z"
          />
        </svg>
        <svg
          className="absolute bottom-0 w-[200%] h-full animate-wave-slower"
          style={{ left: "-50%" }}
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            fill="hsl(221 83% 53% / 0.04)"
            d="M0,120 C400,80 800,160 1200,120 L1200,200 L0,200 Z"
          />
        </svg>
        <svg
          className="absolute bottom-0 w-[200%] h-full animate-wave"
          style={{ left: "-50%" }}
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            fill="hsl(221 83% 53% / 0.08)"
            d="M0,80 C250,40 500,120 750,80 C900,55 1050,105 1200,80 L1200,200 L0,200 Z"
          />
        </svg>
      </div>
    </div>
  );
}
