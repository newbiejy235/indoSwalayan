import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";

/** Isi path gambar hero di sini, contoh: "/hero.png" */
const HERO_IMAGE = "";

const socials = [
  { label: "WhatsApp", href: "https://wa.me/", icon: faWhatsapp },
  { label: "Telegram", href: "https://t.me/", icon: faPaperPlane },
  { label: "Instagram", href: "https://instagram.com/", icon: faInstagram },
];

export default function Hero() {
  return (
    <section id="home" className="bg-[#EDE1B5] px-6 pb-24 pt-36 sm:px-12 lg:px-20">
      <div className="mx-auto grid max-w-[1300px] items-center gap-12 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl font-medium leading-[1.5] sm:text-5xl">
            Belanja Mudah
            <br />
            <span className="relative inline-block">
              Bisnis Lebih Terarah.
              <span className="animate-draw-line absolute -bottom-1 left-0 h-[5px] w-full rounded-full bg-[#EEBE20] shadow-[0_4px_4px_rgba(0,0,0,0.25)]" />
            </span>
          </h1>

          <p className="font-body mt-6 text-lg font-light leading-relaxed sm:text-xl">
            Apa pun kebutuhanmu?
            <br />
            kami siap menemani setiap langkah belanjamu.
          </p>

          <a
            href="#product"
            className="font-display group relative mt-12 inline-flex items-center gap-4 overflow-hidden rounded-full bg-black px-7 py-3 text-md font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:text-black hover:shadow-[0_10px_20px_rgba(0,0,0,0.18)] active:translate-y-0 active:scale-[0.98] sm:text-xl"
          >
            <span className="absolute inset-0 origin-left scale-x-0 bg-[#EEBE20] transition-transform duration-500 ease-out group-hover:scale-x-100" />
            <span className="relative text-xs">Jelajahi produk!!</span>
            <FontAwesomeIcon
              icon={faArrowRight}
              className="relative transition-transform duration-300 group-hover:translate-x-1.5"
            />
          </a>

          <div className="mt-9 flex gap-6">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-black text-2xl text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#EEBE20] hover:text-black active:scale-95"
              >
                <FontAwesomeIcon icon={s.icon} size="xs" />
              </a>
            ))}
          </div>
        </div>

        <div className="aspect-[7/6] w-full overflow-hidden rounded-2xl">
          {HERO_IMAGE ? (
            <img src={HERO_IMAGE} alt="IndoSwalayan" className="h-full w-full object-cover" />
          ) : (
            <div className="font-body flex h-full w-full items-center justify-center rounded-2xl border-2 border-dashed border-black/25 text-sm text-black/50">
              <img src="/images/Rectangle 6.png" alt="" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}