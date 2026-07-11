import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Activity, ArrowRight, BarChart3, Brain, CheckCircle2, Clock3, LineChart, Pill, ScanLine, ShieldCheck, Star, UploadCloud, UsersRound, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import heroMedicineImage from "@/assets/pharmaguard-amoxicillin-hero.png";
import workflowMedicineImage from "@/assets/pharmaguard-workflow-medicine.png";
import { modelFacts } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";

const modelAccuracy = formatPercent(modelFacts.testAccuracy, 2);

const benefits = [
  {
    title: "AI-Powered Detection",
    description: "Analyzes medicine package images to identify learned visual patterns associated with authentic and suspicious products.",
    Icon: Brain,
  },
  {
    title: "Fast Authentication",
    description: "Receive authentication insights within seconds to support faster pharmacy screening and decision-making.",
    Icon: Clock3,
  },
  {
    title: "Confidence-Based Screening",
    description: "Every prediction includes a confidence score, helping pharmacists identify results that may require manual review.",
    Icon: ShieldCheck,
  },
  {
    title: "Pharmacy Decision Support",
    description: "Clear Real, Fake, or Suspicious classifications help pharmacists make more informed medicine verification decisions.",
    Icon: UsersRound,
  },
];

const modelBenefits = [
  "Strong test-set authentication performance",
  "Learns visual medicine packaging patterns",
  "Supports confidence-based screening",
  "Designed for fast image-based analysis",
];

export function LandingPage() {
  useEffect(() => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section id="home" className="relative flex items-center scroll-mt-24 overflow-hidden border-b border-blue-100 bg-[linear-gradient(120deg,#ffffff_0%,#f7fbff_46%,#eef8ff_100%)] px-4 py-10 md:py-12 lg:min-h-[620px] lg:px-8 lg:py-9 xl:min-h-[640px]">
          <div className="absolute inset-0 blue-grid opacity-60" />
          <div className="absolute inset-y-0 right-0 w-[44%] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(213,238,255,0.75))]" />
          <div className="relative mx-auto grid w-full max-w-[1360px] items-center gap-8 lg:grid-cols-[0.92fr_1.08fr] xl:gap-12">
            <div>
              <h1 className="max-w-[650px] text-3xl font-black leading-[1.06] tracking-[-0.035em] text-foreground md:text-4xl lg:text-[2.8rem] xl:text-[3rem]">
                AI-Driven Pharmaceutical<span className="hidden lg:inline"><br /></span>{" "}
                <span className="text-primary">Authentication</span> for Safer<span className="hidden lg:inline"><br /></span>{" "}
                Medicine Verification
              </h1>
              <p className="mt-4 max-w-[590px] text-sm leading-6 text-muted-foreground lg:mt-3.5">
                Use artificial intelligence to analyze medicine package images and identify potential fake, real, or suspicious products.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row lg:mt-3.5">
                <Button asChild size="default">
                  <Link to="/login"><ScanLine className="h-4 w-4" /> Start Authentication <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="default" variant="outline">
                  <Link to="/app/models"><Brain className="h-4 w-4" /> View AI Models</Link>
                </Button>
              </div>
              <div className="mt-5 grid max-w-[610px] gap-4 sm:grid-cols-3 lg:mt-4 lg:gap-3">
                <HeroFeature Icon={Brain} title="AI-Powered" detail="Detection" />
                <HeroFeature Icon={ShieldCheck} title="Advanced" detail="Verification" />
                <HeroFeature Icon={BarChart3} title="Trusted by" detail="Pharmacies" />
              </div>
            </div>
            <HeroScanVisual />
          </div>
        </section>

        <section id="how-it-works" className="relative scroll-mt-24 overflow-hidden bg-white px-4 py-10 lg:px-8 lg:py-9">
          <div className="absolute inset-x-0 top-0 h-12 bg-[linear-gradient(180deg,rgba(223,241,255,0.45),rgba(255,255,255,0))]" />
          <div className="absolute inset-0 blue-grid opacity-25" />
          <div className="relative mx-auto max-w-[1200px]">
            <SectionHeader
              eyebrow="How It Works"
              title="How PharmaGuard AI Works"
              subtitle="From medicine image to authentication insight in seconds — AI-powered verification pharmacists can trust."
            />
            <div className="relative mt-7 lg:mt-6">
              <div className="absolute left-[6.5%] right-[6.5%] top-0 hidden h-1 rounded-full bg-[linear-gradient(90deg,rgba(11,124,255,0.1),rgba(11,124,255,0.9),rgba(11,124,255,0.1))] lg:block" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                <WorkflowCard number={1} titleA="Upload" titleB="Medicine Image" Icon={UploadCloud} variant="upload" />
                <WorkflowCard number={2} titleA="AI Analyzes" titleB="Visual Patterns" Icon={Brain} variant="scan" />
                <WorkflowCard number={3} titleA="Confidence Score" titleB="Generated" Icon={LineChart} variant="score" />
                <WorkflowCard number={4} titleA="Real, Fake, or" titleB="Suspicious Result" Icon={ShieldCheck} variant="result" />
              </div>
            </div>
            <Card className="mx-auto mt-5 max-w-[440px] rounded-[1.35rem] border-blue-200 bg-white/95 shadow-premium">
              <CardContent className="grid items-center gap-4 p-3 text-center sm:grid-cols-[auto_1fr_auto_1fr]">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-primary">
                  <ShieldCheck className="h-7 w-7" />
                </span>
                <Metric value={modelAccuracy} label="Test Accuracy" />
                <span className="hidden h-10 w-px bg-border sm:block" />
                <Metric value={modelFacts.selectedModel} label="Selected Model" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="benefits" className="bg-[#f3f9ff] px-4 py-12 lg:px-8 lg:py-10">
          <div className="mx-auto max-w-[1280px]">
            <SectionHeader
              eyebrow="Platform Benefits"
              title="Built for Safer Pharmacy Decisions"
              subtitle="A calm AI-assisted workflow for pharmacists who need fast, accurate, and reliable medicine authentication insights."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:mt-6 xl:grid-cols-4">
              {benefits.map((benefit) => (
                <BenefitCard key={benefit.title} {...benefit} />
              ))}
            </div>
          </div>
        </section>

        <section id="ai-models" className="scroll-mt-24 bg-[#f3f9ff] px-4 py-12 lg:px-8 lg:py-10">
          <div className="mx-auto max-w-[1280px]">
            <Card className="overflow-hidden border-blue-200 bg-white/92 shadow-premium">
              <CardContent className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.15fr_0.85fr] lg:p-6">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">Model Highlight</p>
                  <h2 className="mt-2 text-xl font-black tracking-tight md:text-2xl">Selected Model: {modelFacts.selectedModel}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    A convolutional neural network was selected for the PharmaGuard AI prototype based on its performance in identifying learned visual patterns in pharmaceutical package images.
                  </p>
                  <div className="mt-4 grid h-28 place-items-center rounded-[1.35rem] border border-blue-100 bg-blue-50/70">
                    <div className="grid h-20 w-20 place-items-center rounded-full border border-blue-200 bg-white shadow-[0_0_0_10px_rgb(223_241_255_/0.9),0_0_0_22px_rgb(223_241_255_/0.45)]">
                      <Brain className="h-9 w-9 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="grid content-center gap-2.5">
                  {modelBenefits.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm font-semibold">{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className="grid content-center gap-2.5">
                  <MiniMetric value={modelAccuracy} label="Test Accuracy" />
                  <MiniMetric value={formatPercent(modelFacts.fakeRecall, 2)} label="Fake Medicine Recall" />
                  <MiniMetric value={modelFacts.selectedModel} label="Selected Model" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 bg-white px-4 py-12 lg:px-8 lg:py-10">
          <Card className="mx-auto max-w-[1280px] overflow-hidden border-blue-200 bg-[linear-gradient(135deg,#ffffff_0%,#f6fbff_100%)] shadow-premium">
            <CardContent className="grid items-center gap-5 p-5 lg:grid-cols-[1.15fr_0.85fr] lg:p-6">
              <div>
                <h2 className="text-xl font-black tracking-tight md:text-2xl">AI-Driven Pharmaceutical Authentication in Somali Pharmacies</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  PharmaGuard AI is an academic prototype exploring AI-assisted medicine package authentication for Somali pharmacy environments. The platform uses image-based screening to help identify visual patterns associated with authentic and potentially suspicious pharmaceutical products.
                </p>
                <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                  The current prototype uses an international public medicine image dataset because a large Somali-specific counterfeit medicine image dataset was not available during development. The system can later be adapted using locally collected and validated medicine package images from Somali pharmacies.
                </p>
              </div>
              <MissionIllustration />
            </CardContent>
          </Card>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function HeroScanVisual() {
  return (
    <div className="relative hidden min-h-[400px] lg:block">
      <div className="absolute left-4 top-4 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">
        <span className="h-px w-7 bg-primary/45" />
        AI scan in progress
        <span className="h-px w-7 bg-primary/45" />
      </div>
      <div className="scan-line absolute bottom-10 left-0 top-10 w-[calc(100%_-_178px)] rounded-[1.6rem] border-2 border-sky-300/75 bg-white/35 p-4 shadow-[0_20px_60px_rgb(11_124_255_/0.12)] xl:w-[calc(100%_-_190px)]">
        <div className="blue-grid absolute inset-3 rounded-[1.4rem] opacity-70" />
        <img
          src={heroMedicineImage}
          alt="Amoxicillin medicine package being scanned"
          className="relative z-10 h-full w-full object-contain drop-shadow-[0_18px_22px_rgb(11_31_74_/0.20)]"
        />
      </div>
      <div className="absolute right-0 top-2 z-20 flex w-[190px] flex-col gap-2">
        <Card className="w-full border-blue-100 bg-white/88 shadow-[0_16px_40px_rgb(11_31_74_/0.10)] backdrop-blur-xl">
          <CardContent className="p-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Authentication Status</p>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-green-100 text-real">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <strong className="block text-base font-black text-real">Ready</strong>
                <span className="text-sm font-extrabold text-real">{modelAccuracy}</span>
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-green-100">
              <div className="h-full rounded-full bg-real" style={{ width: modelAccuracy }} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{modelFacts.selectedModel} test accuracy</p>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-1.5 px-3">
          <HeroStep title="Package Detected" />
          <HeroStep title="AI Verification" />
          <HeroStep title="Authenticity Check" />
        </div>
        <Card className="w-full border-blue-200 bg-white/82 shadow-premium backdrop-blur-xl">
          <CardContent className="flex items-center gap-2.5 p-3">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-blue-50 text-primary">
              <Star className="h-5 w-5" />
            </span>
            <div>
              <strong className="block text-sm">Securing Medicines.</strong>
              <span className="block text-xs text-muted-foreground">Protecting Communities.</span>
              <span className="mt-0.5 block text-[11px] font-bold text-primary">Built for Somali Pharmacies</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HeroStep({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-green-200 bg-white text-real shadow-sm">
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>
      <div>
        <strong className="block text-sm">{title}</strong>
        <span className="text-[11px] text-muted-foreground">Completed</span>
      </div>
    </div>
  );
}

function HeroFeature({ Icon, title, detail }: { Icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 border-blue-100 sm:border-r sm:pr-4 last:border-r-0">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <div className="text-sm font-semibold leading-5">
        <span className="block">{title}</span>
        <span className="block">{detail}</span>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle: string }) {
  const isWorkflowHeader = title === "How PharmaGuard AI Works";
  const displaySubtitle = title === "How PharmaGuard AI Works" ? "From image to insight in seconds - AI-powered verification you can trust." : subtitle;

  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && isWorkflowHeader && (
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-primary/45" />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <span className="h-px w-8 bg-primary/45" />
        </div>
      )}
      {eyebrow && !isWorkflowHeader && <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}
      <h2 className="mt-1.5 text-xl font-black tracking-tight md:text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">{displaySubtitle}</p>
    </div>
  );
}

function WorkflowCard({ number, titleA, titleB, Icon, variant }: { number: number; titleA: string; titleB: string; Icon: LucideIcon; variant: "upload" | "scan" | "score" | "result" }) {
  return (
    <div className="relative pt-5">
      <span className="absolute left-1/2 top-0 z-20 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-primary text-sm font-black text-white shadow-[0_8px_20px_rgb(11_124_255_/0.3)]">{number}</span>
      {number < 4 && (
        <ArrowRight className="absolute -right-[18px] top-1/2 z-20 hidden h-4 w-4 -translate-y-1/2 text-primary lg:block" />
      )}
      <div className="group h-full rounded-[1.35rem] border border-blue-200 bg-white/96 p-3.5 shadow-premium transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_20px_50px_rgb(11_124_255_/0.14)] lg:p-3">
        <div className="grid min-h-[155px] place-items-center rounded-[1rem] bg-white p-2 lg:min-h-[120px]">
          <WorkflowVisual variant={variant} />
        </div>
        <div className="mt-3 flex items-center gap-3 lg:mt-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="text-sm font-extrabold leading-tight">{titleA}<br /><span className="text-xs font-semibold text-muted-foreground">{titleB}</span></h3>
        </div>
      </div>
    </div>
  );
}

function WorkflowVisual({ variant }: { variant: "upload" | "scan" | "score" | "result" }) {
  if (variant === "score") {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[conic-gradient(#22c55e_0_56deg,var(--primary)_56deg_337deg,#dff1ff_337deg_360deg)] p-2 shadow-[0_12px_28px_rgb(11_124_255_/0.12)]">
          <div className="grid h-full w-full place-items-center rounded-full bg-white px-1 text-center">
            <div className="flex flex-col items-center gap-0.5">
              <strong className="block text-base font-black leading-none text-real">{modelAccuracy}</strong>
              <span className="block max-w-[64px] text-[10px] font-semibold leading-tight text-muted-foreground">Confidence Score</span>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-3 flex h-3 max-w-32 items-center justify-center gap-1">
          {Array.from({ length: 24 }).map((_, index) => (
            <span key={index} className={`h-2 w-1 rounded-full ${index > 20 ? "bg-primary" : "bg-real/70"}`} />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "result") {
    return (
      <div className="w-full rounded-2xl border border-green-100 bg-white p-3.5 text-center lg:p-2.5">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-[2rem] bg-green-100 text-real shadow-[0_12px_28px_rgb(34_197_94_/0.16)] lg:h-12 lg:w-12">
          <ShieldCheck className="h-10 w-10 fill-real/20 lg:h-7 lg:w-7" />
        </span>
        <strong className="mt-2 block text-2xl font-black text-real lg:mt-1 lg:text-lg">Real</strong>
        <span className="mt-1 block text-lg font-extrabold text-real lg:text-sm">{modelAccuracy}</span>
        <span className="mx-auto mt-2 inline-flex rounded-full bg-green-100 px-3 py-0.5 text-xs font-bold text-real lg:mt-1">Authentic</span>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <img src={workflowMedicineImage} alt="Medicine package preview" className="mx-auto h-28 w-full object-contain drop-shadow-[0_12px_16px_rgb(7_22_61_/0.12)] lg:h-24" />
      {variant === "scan" && (
        <>
          <div className="absolute inset-x-4 inset-y-2.5 rounded-xl border-2 border-dashed border-sky-300/90" />
          <span className="absolute left-5 top-4 h-3 w-3 border-l-2 border-t-2 border-primary" />
          <span className="absolute right-5 top-4 h-3 w-3 border-r-2 border-t-2 border-primary" />
          <span className="absolute bottom-4 left-5 h-3 w-3 border-b-2 border-l-2 border-primary" />
          <span className="absolute bottom-4 right-5 h-3 w-3 border-b-2 border-r-2 border-primary" />
          <span className="scan-line absolute inset-y-2 left-1/2 w-5 -translate-x-1/2 bg-sky-300/20 shadow-[0_0_18px_5px_rgb(14_165_233_/0.35)]" />
        </>
      )}
    </div>
  );
}

function BenefitCard({ title, description, Icon }: { title: string; description: string; Icon: LucideIcon }) {
  return (
    <div className="h-full rounded-[1.35rem] border border-blue-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_20px_50px_rgb(11_124_255_/0.12)] lg:p-3.5">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-primary lg:h-10 lg:w-10">
        <Icon className="h-6 w-6 lg:h-5 lg:w-5" />
      </span>
      <h3 className="mt-4 text-base font-extrabold lg:mt-3">{title}</h3>
      <p className="mt-2.5 text-sm leading-6 text-muted-foreground lg:mt-2 lg:leading-5">{description}</p>
    </div>
  );
}

function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/55 p-3 lg:p-2.5">
      <strong className="block text-lg font-black text-primary">{value}</strong>
      <span className="mt-1 block text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

function MissionIllustration() {
  return (
    <div className="relative grid min-h-[230px] place-items-center overflow-hidden rounded-[1.75rem] border border-blue-100 bg-blue-50/70 lg:min-h-[200px]">
      <div className="absolute h-48 w-48 rounded-full bg-blue-200/45 blur-2xl" />
      <div className="relative grid h-40 w-40 place-items-center rounded-full border border-blue-200 bg-white/80 shadow-premium">
        <ShieldCheck className="absolute h-20 w-20 text-primary/20" />
        <div className="relative grid gap-3">
          <span className="mx-auto grid h-16 w-12 place-items-center rounded-2xl border border-blue-200 bg-white text-primary shadow-sm">
            <Activity className="h-7 w-7" />
          </span>
          <div className="flex justify-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white"><Pill className="h-4 w-4" /></span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-primary shadow-sm"><Pill className="h-4 w-4" /></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <strong className="block text-xl font-black text-primary">{value}</strong>
      <span className="mt-1 block text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
