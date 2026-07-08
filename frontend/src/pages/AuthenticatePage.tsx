import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FlaskConical, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/layout/PageHeader";
import { MedicineUpload } from "@/components/authentication/MedicineUpload";
import { AnalysisProgressPanel } from "@/components/authentication/AnalysisProgressPanel";
import { PredictionResultCard } from "@/components/shared/PredictionResultCard";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  isUnsupportedImageError,
  predictMedicineImage,
  toPredictionApiError,
  unsupportedImagePrediction,
  type PredictionApiError,
} from "@/api/predictions";
import { fileToDataUrl, savePredictionScan } from "@/api/records";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import type { PredictionResponse } from "@/types/domain";

const MAX_STORED_PREVIEW_SIZE = 1.5 * 1024 * 1024;

export function AuthenticatePage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<PredictionApiError | null>(null);
  const [savedScanId, setSavedScanId] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const analysis = useAnalysisProgress();

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectFile = (selected: File, selectedPreviewUrl: string) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(selectedPreviewUrl);
    setResult(null);
    setError(null);
    setSavedScanId("");
    setShowResult(false);
    analysis.reset();
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setResult(null);
    setError(null);
    setSavedScanId("");
    setShowResult(false);
    analysis.reset();
  };

  const analyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setShowResult(false);
    setResult(null);
    setError(null);
    setSavedScanId("");
    analysis.start();

    try {
      const prediction = await predictMedicineImage(file);
      const imageDataUrl =
        file.size <= MAX_STORED_PREVIEW_SIZE ? await fileToDataUrl(file).catch(() => undefined) : undefined;
      await analysis.complete();
      setResult(prediction);
      setShowResult(true);
      try {
        const savedScan = await savePredictionScan(prediction, { fileName: file.name, imageDataUrl });
        setSavedScanId(savedScan.id);
      } catch (saveError) {
        const saveApiError = toPredictionApiError(saveError);
        setError({
          ...saveApiError,
          title: "Result generated, but not saved",
          message: `${saveApiError.message} The AI result is shown below, but it was not saved to history.`,
          variant: "warning",
        });
      }
    } catch (requestError) {
      const predictionError = toPredictionApiError(requestError);
      if (isUnsupportedImageError(predictionError)) {
        const suspiciousPrediction = unsupportedImagePrediction(predictionError);
        try {
          const imageDataUrl =
            file.size <= MAX_STORED_PREVIEW_SIZE ? await fileToDataUrl(file).catch(() => undefined) : undefined;
          await analysis.complete();
          setResult(suspiciousPrediction);
          setShowResult(true);
          setError(null);
          const savedScan = await savePredictionScan(suspiciousPrediction, { fileName: file.name, imageDataUrl });
          setSavedScanId(savedScan.id);
          return;
        } catch (saveError) {
          const saveApiError = toPredictionApiError(saveError);
          setError({
            ...predictionError,
            message: `${predictionError.message} The warning could not be saved to Suspicious Cases. ${saveApiError.message}`,
          });
        }
      } else {
        analysis.reset();
        setError(predictionError);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const showProgress = isAnalyzing || (analysis.progress > 0 && !showResult && !error);

  return (
    <div>
      <PageHeader
        eyebrow="Medicine Authentication"
        title="Authenticate Medicine"
        description="Upload a clear image of the medicine package and let the AI model analyze it for a Real, Fake, or confidence-based Suspicious result."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.96fr]">
        <Card>
          <CardHeader>
            <CardTitle>1. Upload medicine image</CardTitle>
          </CardHeader>
          <CardContent>
            <MedicineUpload file={file} previewUrl={previewUrl} onSelect={selectFile} onClear={clearFile} />
            <Button className="mt-5 w-full" size="lg" disabled={!file || isAnalyzing} onClick={analyze}>
              {isAnalyzing ? (
                <>
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-xs font-black">
                    {analysis.progress}
                  </span>
                  {analysis.label} · {analysis.progress}%
                </>
              ) : (
                <>
                  <FlaskConical className="h-5 w-5" />
                  Analyze Medicine
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>2. AI authentication result</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant={error.variant} className="mb-5">
                <AlertTitle>{error.title}</AlertTitle>
                <AlertDescription>
                  {error.message}
                  {error.code ? ` Code: ${error.code}.` : ""}
                </AlertDescription>
              </Alert>
            )}
            {showProgress && (
              <AnalysisProgressPanel
                progress={analysis.progress}
                label={analysis.label}
                stageIndex={analysis.stageIndex}
              />
            )}
            {!showProgress && showResult && result && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-5 duration-500">
                <PredictionResultCard result={result} onCreateReport={() => navigate("/app/reports")} />
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                    {savedScanId
                      ? `Scan ${savedScanId} saved to history${result.prediction !== "Real" ? " and added to Suspicious Cases" : ""}. `
                      : "This result has not been saved to history yet. "}
                    <Link className="font-semibold text-primary" to="/app/history">
                      View scan history
                    </Link>
                  </AlertDescription>
                </Alert>
              </div>
            )}
            {!showProgress && !showResult && !error && (
              <EmptyState
                Icon={ShieldCheck}
                title={file ? "Image ready for analysis" : "No image selected"}
                description={
                  file
                    ? "Start the AI analysis to generate a prediction and confidence scores."
                    : "Select a clear medicine package photo to begin."
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
      <Alert className="mt-5">
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>
          AI-assisted screening supports pharmacy decisions and does not replace professional or regulatory verification.
        </AlertDescription>
      </Alert>
    </div>
  );
}
