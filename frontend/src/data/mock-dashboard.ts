import type { PredictionStatus } from "@/types/domain";

export const dashboardMetrics = [
  { label: "Total Scans", value: 1248, delta: "18.7% vs yesterday", tone: "blue" },
  { label: "Real Medicines", value: 982, delta: "78.7% of total scans", tone: "real" },
  { label: "Fake Detections", value: 173, delta: "13.9% of total scans", tone: "fake" },
  { label: "Suspicious Cases", value: 93, delta: "7.4% of total scans", tone: "suspicious" },
] as const;

export const verificationOverview: Array<{ name: PredictionStatus; value: number }> = [
  { name: "Real", value: 982 },
  { name: "Fake", value: 173 },
  { name: "Suspicious", value: 93 },
];

export const recentActivity = [
  { id: "act-1", time: "09:41 AM", medicine: "Amoxicillin 500mg", result: "Real" as const, confidence: 0.96, user: "Ahmed H." },
  { id: "act-2", time: "09:38 AM", medicine: "Paracetamol 500mg", result: "Real" as const, confidence: 0.91, user: "Ahmed H." },
  { id: "act-3", time: "09:34 AM", medicine: "Ciprofloxacin 250mg", result: "Fake" as const, confidence: 0.88, user: "Ahmed H." },
  { id: "act-4", time: "09:31 AM", medicine: "Diclofenac 50mg", result: "Suspicious" as const, confidence: 0.58, user: "Ahmed H." },
  { id: "act-5", time: "09:27 AM", medicine: "Metronidazole 400mg", result: "Real" as const, confidence: 0.9, user: "Ahmed H." },
];
