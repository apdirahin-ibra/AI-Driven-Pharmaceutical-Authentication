import { useRef, useState } from "react";
import { FileImage, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface MedicineUploadProps {
  file: File | null;
  previewUrl: string;
  onSelect: (file: File, previewUrl: string) => void;
  onClear: () => void;
}

export function MedicineUpload({ file, previewUrl, onSelect, onClear }: MedicineUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");

  const chooseFile = (candidate?: File) => {
    setError("");
    if (!candidate) return;
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setError("Please select a JPG, JPEG, PNG, or WebP image.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setError("The selected image is larger than 10 MB.");
      return;
    }
    onSelect(candidate, URL.createObjectURL(candidate));
  };

  const clearSelection = () => {
    if (inputRef.current) inputRef.current.value = "";
    onClear();
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-2xl border border-dashed border-blue-300 bg-blue-50/40 p-5 transition",
          isDragging && "border-primary bg-blue-100/60",
          file && "border-solid bg-card",
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          chooseFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        {file ? (
          <div className="space-y-4">
            <div className="grid min-h-[320px] place-items-center overflow-hidden rounded-2xl bg-slate-50">
              <img src={previewUrl} alt="Selected medicine package preview" className="max-h-[420px] w-full object-contain p-4" />
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-primary">
                  <FileImage className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <strong className="block truncate text-sm">{file.name}</strong>
                  <small className="text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB ready for analysis</small>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>Replace</Button>
                <Button type="button" variant="ghost" size="icon" onClick={clearSelection} aria-label="Remove image">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <button type="button" className="grid min-h-[360px] w-full place-items-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => inputRef.current?.click()}>
            <span className="text-center">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-card text-primary shadow-sm">
                <UploadCloud className="h-10 w-10" />
              </span>
              <strong className="mt-5 block text-xl">Drag and drop image here</strong>
              <span className="mt-2 block text-sm text-muted-foreground">or click to browse medicine package images</span>
              <span className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">JPG, JPEG, PNG, WebP. Maximum 10 MB.</span>
            </span>
          </button>
        )}
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Invalid image</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
