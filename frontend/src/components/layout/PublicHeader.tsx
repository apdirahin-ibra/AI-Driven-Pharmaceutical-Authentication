import { Link } from "react-router-dom";
import type { MouseEvent } from "react";
import { ArrowRight, Menu, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandMark } from "@/components/shared/BrandMark";

const links = [
  { label: "Home", href: "/#home" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "AI Models", href: "/#ai-models" },
  { label: "About", href: "/#about" },
];

export function PublicHeader() {
  const scrollToLandingSection = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("/#") || window.location.pathname !== "/") return;
    event.preventDefault();
    window.history.pushState(null, "", href);
    document.querySelector(href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 lg:px-8">
        <Link to="/" aria-label="PharmaGuard AI home">
          <BrandMark />
        </Link>
        <nav className="hidden items-center gap-10 text-base font-medium text-foreground lg:flex">
          {links.map((link) => (
            <Link key={link.label} to={link.href} onClick={(event) => scrollToLandingSection(event, link.href)} className={`relative py-2 hover:text-primary ${link.label === "Home" ? "text-foreground after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-5 after:-translate-x-1/2 after:rounded-full after:bg-primary" : ""}`}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild variant="outline" size="default">
            <Link to="/login"><UserRound className="h-4 w-4" /> Sign In</Link>
          </Button>
          <Button asChild size="default">
            <Link to="/login">Get Started <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle><BrandMark /></SheetTitle>
            </SheetHeader>
            <nav className="mt-6 grid gap-2.5">
              {links.map((link) => (
                <Link key={link.label} to={link.href} onClick={(event) => scrollToLandingSection(event, link.href)} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-muted">{link.label}</Link>
              ))}
              <Button asChild className="mt-3"><Link to="/login">Get Started</Link></Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
