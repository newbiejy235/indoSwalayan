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
    <header className="md:fixed flex w-full justify-center md:left-1/2 md:top-0 md:z-50 md:-translate-x-1/2">
      <nav className="font-display flex items-center gap-5 rounded-b-[28px] bg-black px-6 py-4 text-white sm:gap-12 sm:px-14">
        {/* Taruh logo di /public/logo.png */}
        <img src="/images/logoPutih2.png" alt="IndoSwalayan" className="h-10 w-auto" />
        <ul className="flex items-center gap-4 text-sm font-medium sm:gap-10 sm:text-base">
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