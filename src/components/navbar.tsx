"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Book, Bot, History } from "lucide-react";

const navLinks = [
  { href: "/", label: "Journal", icon: Book },
  { href: "/simulator", label: "Simulator", icon: Bot },
  { href: "/history", label: "History", icon: History },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center transition-colors hover:text-foreground/80",
                pathname === href ? "text-foreground" : "text-foreground/60"
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
