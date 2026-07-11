import { useEffect, useState } from "react";
import { FileImage, ImageOff } from "lucide-react";
import { getScanImageReference } from "@/api/records";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const imageUrlCache = new Map<string, string>();

interface MedicineScanImageProps {
  scanId: string;
  alt: string;
  hasImage?: boolean;
  className?: string;
  onOpen?: () => void;
}

export function MedicineScanImage({ scanId, alt, hasImage = true, className, onOpen }: MedicineScanImageProps) {
  const [url, setUrl] = useState(() => imageUrlCache.get(scanId) || "");
  const [isLoading, setIsLoading] = useState(hasImage && !url);
  const [isBroken, setIsBroken] = useState(!hasImage);

  useEffect(() => {
    let active = true;
    if (!hasImage || imageUrlCache.has(scanId)) return undefined;
    setIsLoading(true);
    getScanImageReference(scanId)
      .then((reference) => {
        if (!active) return;
        imageUrlCache.set(scanId, reference.url);
        setUrl(reference.url);
        setIsBroken(false);
      })
      .catch(() => active && setIsBroken(true))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [hasImage, scanId]);

  const content = isLoading ? (
    <Skeleton className="h-full w-full rounded-[inherit]" />
  ) : url && !isBroken ? (
    <img
      src={url}
      alt={alt}
      className="h-full w-full rounded-[inherit] object-cover"
      onError={() => setIsBroken(true)}
    />
  ) : (
    <span className="grid h-full w-full place-items-center rounded-[inherit] bg-blue-50 text-muted-foreground">
      {hasImage ? <ImageOff className="h-5 w-5" aria-hidden="true" /> : <FileImage className="h-5 w-5" aria-hidden="true" />}
      <span className="sr-only">Uploaded image unavailable</span>
    </span>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        className={cn("overflow-hidden rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
        onClick={onOpen}
        aria-label={`Open image for ${alt}`}
      >
        {content}
      </button>
    );
  }

  return <div className={cn("overflow-hidden rounded-xl", className)}>{content}</div>;
}
