"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

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
          className={`flex flex-col items-center ${
            pathname === item.href ? "text-[#FF6B6B]" : "text-gray-500"
          }`}
        >
          {item.href === "/" ? (
            <motion.span 
              className="text-2xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {item.icon}
            </motion.span>
          ) : (
            <span className="text-2xl">{item.icon}</span>
          )}
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
} 