"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/tracker", label: "Daily Tracker", icon: "📅" },
  { href: "/love-enhancer", label: "Love Enhancer", icon: "💖" },
  { href: "/health-fitness", label: "Health & Fitness", icon: "🧘" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-[#e9ecef] flex justify-around items-center py-2 z-50">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center px-2 py-1 text-sm font-semibold transition-colors ${pathname === item.href ? "text-black" : "text-[#22223b]/60"}`}
        >
          <span className="text-xl mb-1">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
} 