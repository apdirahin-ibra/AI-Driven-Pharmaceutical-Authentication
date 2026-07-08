import { useCallback, useEffect, useRef, useState } from "react";

export const analysisStages = [
  { min: 1, max: 24, label: "Preparing image" },
  { min: 25, max: 49, label: "Analyzing visual patterns" },
  { min: 50, max: 74, label: "Calculating confidence" },
  { min: 75, max: 99, label: "Generating assessment" },
  { min: 100, max: 100, label: "Analysis complete" },
] as const;

export function getAnalysisStageLabel(percent: number): string {
  const stage = analysisStages.find((item) => percent >= item.min && percent <= item.max);
  return stage?.label ?? "Processing";
}

export function getAnalysisStageIndex(percent: number): number {
  if (percent >= 100) return analysisStages.length - 1;
  return analysisStages.findIndex((item) => percent >= item.min && percent <= item.max);
}

interface AnalysisProgressControls {
  progress: number;
  label: string;
  stageIndex: number;
  isRunning: boolean;
  start: () => void;
  complete: () => Promise<void>;
  reset: () => void;
}

export function useAnalysisProgress(): AnalysisProgressControls {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const frameRef = useRef(0);
  const progressRef = useRef(0);
  const startTimeRef = useRef(0);

  const stopFrame = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
  }, []);

  const reset = useCallback(() => {
    stopFrame();
    progressRef.current = 0;
    setProgress(0);
    setIsRunning(false);
  }, [stopFrame]);

  const start = useCallback(() => {
    stopFrame();
    progressRef.current = 1;
    setProgress(1);
    setIsRunning(true);
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const eased = 1 - Math.exp(-elapsed / 2600);
      const next = Math.min(94, Math.max(1, Math.floor(1 + eased * 93)));
      progressRef.current = next;
      setProgress(next);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [stopFrame]);

  const complete = useCallback((): Promise<void> => {
    stopFrame();
    setIsRunning(true);

    return new Promise((resolve) => {
      const from = progressRef.current;
      const startedAt = performance.now();
      const duration = 650;

      const animate = (now: number) => {
        const t = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - (1 - t) ** 3;
        const next = Math.max(1, Math.round(from + (100 - from) * eased));
        progressRef.current = next;
        setProgress(next);

        if (t < 1) {
          frameRef.current = requestAnimationFrame(animate);
          return;
        }

        window.setTimeout(() => {
          setIsRunning(false);
          resolve();
        }, 450);
      };

      frameRef.current = requestAnimationFrame(animate);
    });
  }, [stopFrame]);

  useEffect(() => () => stopFrame(), [stopFrame]);

  return {
    progress,
    label: getAnalysisStageLabel(progress),
    stageIndex: getAnalysisStageIndex(progress),
    isRunning,
    start,
    complete,
    reset,
  };
}
