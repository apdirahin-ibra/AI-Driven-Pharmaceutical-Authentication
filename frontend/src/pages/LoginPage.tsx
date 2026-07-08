import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Brain, Eye, EyeOff, LockKeyhole, Mail, ScanLine, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/auth/AuthProvider";
import { BrandMark } from "@/components/shared/BrandMark";
import heroMedicineImage from "@/assets/pharmaguard-amoxicillin-hero.png";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, user, isConfigured } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [navigate, user]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    if (!email || !password) {
      setError("Enter an email and password to continue.");
      return;
    }
    if (!isConfigured) {
      setError("Supabase Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await signIn(email, password);
      navigate("/app/dashboard");
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "";
      setError(message || "Invalid email or password. Check the user exists in Supabase Auth.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.03fr_0.97fr]">
      <section className="relative hidden overflow-hidden bg-[linear-gradient(135deg,#f9fcff_0%,#edf7ff_100%)] px-10 py-7 lg:flex lg:flex-col">
        <div className="absolute inset-0 blue-grid opacity-70" />
        <div className="relative mx-auto flex min-h-full w-full max-w-[700px] flex-col justify-center">
          <Link to="/" className="mb-6"><BrandMark className="[&>span:first-child]:h-13 [&>span:first-child]:w-13 [&_svg]:h-8 [&_svg]:w-8 [&>span:last-child]:text-4xl" /></Link>
          <p className="max-w-xl text-xl leading-8 text-muted-foreground">
            Intelligent pharmaceutical authentication for <span className="font-semibold text-primary">safer pharmacy decisions.</span>
          </p>
          <LoginShowcase />
          <div className="mt-6 grid grid-cols-3 gap-5 text-center text-sm font-semibold">
            <Feature icon={<Brain />} label="AI-powered visual analysis" />
            <Feature icon={<LockKeyhole />} label="Secure medicine image processing" />
            <Feature icon={<BarChart3 />} label="Confidence-based decision support" />
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center bg-white px-5 py-7">
        <div className="w-full max-w-[520px]">
          <Card className="border-blue-100 shadow-[0_24px_70px_rgb(15_38_83_/0.10)]">
            <CardContent className="p-7 md:p-8">
            <div className="flex items-center gap-4">
              <span className="grid h-13 w-13 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-primary"><LockKeyhole className="h-7 w-7" /></span>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Secure Access</h1>
                <p className="mt-1 text-base text-muted-foreground">Sign in to continue to PharmaGuard AI</p>
              </div>
            </div>
            {error && <Alert variant="destructive" className="mt-6"><AlertDescription>{error}</AlertDescription></Alert>}
            <form className="mt-7 space-y-5" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" name="email" type="email" className="pl-11" placeholder="you@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} className="pl-11 pr-11" placeholder="Enter your password" />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="flex items-center gap-2"><Checkbox /> Remember me</label>
                <button type="button" className="font-semibold text-primary">Forgot password?</button>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                <ShieldCheck className="h-5 w-5" />
                {isSubmitting ? "Signing in..." : "Sign In to PharmaGuard"}
              </Button>
            </form>
            <div className="mt-6">
              <div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> Role-based access <span className="h-px flex-1 bg-border" /></div>
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-muted-foreground">
                Admin and Pharmacist access is assigned by an administrator in Supabase Auth.
              </div>
            </div>
            </CardContent>
          </Card>
          <p className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <LockKeyhole className="h-4 w-4" />
            Your data is encrypted and secure
          </p>
        </div>
      </section>
    </main>
  );
}

function LoginShowcase() {
  return (
    <div className="relative mt-7 min-h-[285px]">
      <div className="absolute left-[58%] top-2 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-primary">
        <span className="h-px w-12 bg-sky-300" />
        AI scan in progress
      </div>
      <div className="scan-line absolute inset-x-2 top-8 rounded-[1.5rem] border-2 border-sky-300/75 bg-white/40 p-6 shadow-[0_24px_70px_rgb(11_124_255_/0.12)]">
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-20 h-px bg-sky-300 shadow-[0_0_18px_4px_rgb(14_165_233_/0.55)]" />
        <span className="absolute left-[62%] top-[44%] z-30 grid h-9 w-9 place-items-center rounded-full border border-sky-200 bg-white text-primary shadow-sm">
          <ScanLine className="h-4 w-4" />
        </span>
        <img
          src={heroMedicineImage}
          alt="Amoxicillin medicine package scan"
          className="relative z-10 h-[215px] w-full object-contain drop-shadow-[0_20px_24px_rgb(7_22_61_/0.18)]"
        />
      </div>
      <div className="absolute right-2 top-24 z-30 rounded-2xl border border-blue-100 bg-white/90 p-3 text-sm shadow-premium backdrop-blur">
        <p className="text-xs font-extrabold uppercase tracking-wide text-primary">Authenticity</p>
        <strong className="mt-1 block text-primary">Real</strong>
        <span className="text-muted-foreground">93.54% accuracy</span>
      </div>
      <div className="absolute bottom-8 right-16 h-20 w-20 rounded-full border border-sky-200 opacity-60">
        <div className="absolute inset-4 rounded-full border border-sky-300" />
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400" />
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="grid gap-3">
      <span className="mx-auto text-primary [&>svg]:h-8 [&>svg]:w-8">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
