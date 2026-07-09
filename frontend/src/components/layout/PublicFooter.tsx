import { Link } from "react-router-dom";
import { BrandMark } from "@/components/shared/BrandMark";

export function PublicFooter() {
  return (
    <footer className="border-t border-blue-100 bg-white">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 md:grid-cols-2 lg:grid-cols-[1.35fr_0.75fr_0.85fr_1.2fr] lg:px-8">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            AI-driven pharmaceutical authentication for safer medicine verification in Somali pharmacies.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold">Navigation</h4>
          <div className="mt-4 grid gap-2.5 text-sm text-muted-foreground">
            <Link to="/">Home</Link>
            <Link to="/#how-it-works">How It Works</Link>
            <Link to="/app/models">AI Models</Link>
            <Link to="/#about">About</Link>
            <Link to="/login">Sign In</Link>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold">Resources</h4>
          <div className="mt-4 grid gap-2.5 text-sm text-muted-foreground">
            <Link to="/app/models">Model Information</Link>
            <Link to="/#about">Research Context</Link>
            <Link to="/app/authenticate">Authentication Guide</Link>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold">Disclaimer</h4>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            AI-assisted screening supports pharmacy decisions and does not replace professional, laboratory, or regulatory medicine verification.
          </p>
        </div>
      </div>
      <div className="border-t border-blue-100 px-4 py-4 text-center text-sm text-muted-foreground">
        © 2026 PharmaGuard AI — Academic Prototype
      </div>
    </footer>
  );
}
