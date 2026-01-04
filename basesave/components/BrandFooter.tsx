export function BrandFooter() {
  return (
    <footer className="mt-10 pt-8 border-t border-[#1E1F25] text-center space-y-2">
      <p className="text-xs font-semibold tracking-[0.3em] text-[#A0A0A0] uppercase">
        Built with Love by Dev Royale
      </p>
      <div className="flex items-center justify-center gap-4 text-xs text-[#A0A0A0]">
        <a
          href="https://x.com/iamdevroyale"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00D4FF] hover:text-white transition-colors duration-200"
        >
          Follow on X
        </a>
        <span className="text-[#1E1F25]">•</span>
        <a
          href="https://github.com/kemerald25"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00D4FF] hover:text-white transition-colors duration-200"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
