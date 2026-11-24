"use client";

import { useEffect, useState } from "react";

const links = [
  { label: "Home", href: "#home", id: "home" },
  { label: "Product", href: "#product", id: "product" },
  { label: "Contact", href: "#contact", id: "contact" },
  { label: "Dashboard", href: "/login", id: "dashboard" },
];

export default function Navbar() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const sections = ["home", "product", "contact"]
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        }),
      { rootMargin: "-40% 0px -55% 0px" }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 flex w-full justify-center px-2 sm:px-4 md:fixed md:top-0 md:left-1/2 md:-translate-x-1/2">
      <nav className="font-display flex max-w-full items-center justify-between gap-3 overflow-x-auto rounded-b-[24px] bg-black px-4 py-3 text-white sm:gap-8 sm:rounded-b-[28px] sm:px-10 sm:py-4 md:gap-12 md:px-14">
        {/* Taruh logo di /public/logo.png */}
        <img
          src="/images/logoPutih2.png"
          alt="IndoSwalayan"
          className="h-7 w-auto shrink-0 sm:h-10"
        />
        <ul className="flex items-center gap-3 whitespace-nowrap text-xs font-medium sm:gap-8 sm:text-sm md:gap-10 md:text-base">
          {links.map((link) => (
            <li key={link.id}>
              <a href={link.href} className="group relative inline-block py-1">
                {link.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-[3px] rounded-full bg-[#EEBE20] transition-all duration-300 ${
                    active === link.id ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}