import Link from "next/link"

export default function Footer() {
  return (
    <footer id="contact" className="font-body bg-[#111111] text-white">
      <div className="mx-auto max-w-7xl px-8 pt-16 pb-8 md:px-14">
        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-12 border-b border-white/15 pb-12 md:grid-cols-2">
          {/* Brand */}
          <div className="space-y-5">
            <h2 className="text-3xl font-bold tracking-tight">
              Indo<span className="text-[#EEBE20]">Swalayan.</span>
            </h2>

            <p className="max-w-sm text-sm leading-relaxed text-gray-400">
              Temukan berbagai kebutuhan harianmu dengan lebih mudah. Kami hadir
              untuk memberikan pengalaman belanja yang praktis, nyaman, dan
              terpercaya.
            </p>

            <span className="inline-flex items-center gap-2 text-xs text-gray-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#EEBE20]" />
              Your daily needs, made easier.
            </span>
          </div>

          {/* Contact */}
          <div className="flex flex-col justify-between gap-8 md:items-end">
            <div className="space-y-4 md:text-right">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#EEBE20] uppercase">
                Get In Touch
              </p>

              <h3 className="text-2xl font-semibold">
                Ada pertanyaan?
                <br />
                <span className="text-gray-400">Hubungi kami.</span>
              </h3>

              <a
                href="mailto:dbankaii@gmail.com"
                className="inline-block text-sm text-white transition-colors hover:text-[#EEBE20]"
              >
                dbankaii@gmail.com ↗
              </a>
            </div>

            <Link
              href="#"
              className="w-fit border-b border-[#EEBE20] pb-1 text-xs text-gray-400 transition-colors hover:text-[#EEBE20]"
            >
              Back to top ↑
            </Link>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-gray-500 md:flex-row">
          <p>© {new Date().getFullYear()} IndoSwalayan. All rights reserved.</p>

          <p>
            Made with <span className="text-[#EEBE20]">♥</span> for better
            shopping.
          </p>
        </div>
      </div>
    </footer>
  )
}
