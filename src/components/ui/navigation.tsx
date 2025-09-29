"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Moon, Sun } from "lucide-react";

const navItems = [
  { href: "/", label: "Gallery" },
  { href: "/bento", label: "Bentos" },
  { href: "/casestudies", label: "Case Studies" },
  { href: "/contacts", label: "Contact" },
  { href: "/ctas", label: "CTAs" },
  { href: "/faqs", label: "FAQs" },
  { href: "/feature", label: "Features" },
  { href: "/footers", label: "Footers" },
  { href: "/hero", label: "Hero" },
  { href: "/navbars", label: "Navbars" },
  { href: "/pricing", label: "Pricing" },
  { href: "/stats", label: "Stats" },
  { href: "/team", label: "Team" },
  { href: "/testimonial", label: "Testimonials" },
];

function useTheme() {
  const [theme, setTheme] = React.useState<string | null>(null);

  React.useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    const root = document.documentElement;
    if (initial === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, []);

  const toggle = React.useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      const root = document.documentElement;
      if (next === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
      localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  return { theme, toggle } as const;
}

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-background/70 supports-[backdrop-filter]:bg-background/60 backdrop-blur-md border-b border-border/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-1">
            <Link 
              href="/" 
              className="text-xl font-bold text-foreground hover:text-foreground/80 transition-colors"
            >
              Orchids
            </Link>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap border border-transparent ${
                  pathname === item.href
                    ? "bg-muted text-foreground border-border/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border/60"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={toggle}
              className="ml-1 inline-flex items-center justify-center size-9 rounded-md border border-border/60 bg-background/60 supports-[backdrop-filter]:bg-background/50 backdrop-blur hover:bg-accent/60 hover:text-accent-foreground text-foreground/80 shadow-xs"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}