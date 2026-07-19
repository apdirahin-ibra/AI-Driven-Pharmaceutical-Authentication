import { useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfidenceProgress } from "@/components/shared/ConfidenceProgress";
import { MedicineScanImage } from "@/components/shared/MedicineScanImage";
import { useScanRecords } from "@/hooks/useRecords";
import { deleteScanRecord } from "@/api/records";
import { formatDateTime } from "@/lib/utils";
import type { PredictionStatus, ScanRecord } from "@/types/domain";

export function HistoryPage() {
  const { records: scanHistory, isLoading, error } = useScanRecords();
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<"All" | PredictionStatus>("All");
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [deletingId, setDeletingId] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const filtered = useMemo(() => scanHistory.filter((scan) => {
    const matchesQuery = `${scan.id} ${scan.medicine} ${scan.imageLabel}`.toLowerCase().includes(query.toLowerCase());
    const matchesResult = resultFilter === "All" || scan.result === resultFilter;
    return matchesQuery && matchesResult;
  }), [scanHistory, query, resultFilter]);

  const removeScan = async (scan: ScanRecord) => {
    const confirmed = window.confirm(
      `Delete ${scan.id}? This permanently removes the scan, its linked risk report, and uploaded image.`,
    );
    if (!confirmed) return;

    setDeletingId(scan.id);
    setActionError("");
    setActionMessage("");
    try {
      await deleteScanRecord(scan.id);
      if (selectedScan?.id === scan.id) setSelectedScan(null);
      setActionMessage(`${scan.id} was deleted.`);
    } catch (caughtError) {
      const detail = caughtError instanceof AxiosError ? caughtError.response?.data?.detail : null;
      setActionError(
        typeof detail?.message === "string"
          ? detail.message
          : "The scan could not be deleted. Check your connection and try again.",
      );
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Scan History"
        title="Track Every Scan"
        description="Search medicine authentication records, inspect confidence values, and review individual scan details."
      />
      <Card>
        <CardHeader><CardTitle>Scan History</CardTitle></CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription></Alert>}
          {actionError && <Alert variant="destructive" className="mb-5"><AlertDescription>{actionError}</AlertDescription></Alert>}
          {actionMessage && <Alert className="mb-5"><AlertDescription>{actionMessage}</AlertDescription></Alert>}
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_190px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by medicine or scan ID" />
            </div>
            <Select value={resultFilter} onValueChange={(value) => setResultFilter(value as "All" | PredictionStatus)}>
              <SelectTrigger><SelectValue placeholder="All Results" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Results</SelectItem>
                <SelectItem value="Real">Real</SelectItem>
                <SelectItem value="Fake">Fake</SelectItem>
                <SelectItem value="Suspicious">Suspicious</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <Table>
              <TableHeader><TableRow><TableHead>Medicine / Scan</TableHead><TableHead>Result</TableHead><TableHead>Confidence</TableHead><TableHead>Pharmacist</TableHead><TableHead>Scanned</TableHead><TableHead>Review</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Loading scan history...</TableCell>
                  </TableRow>
                )}
                {filtered.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <MedicineScanImage scanId={scan.id} hasImage={scan.hasImage} alt={`${scan.medicine} uploaded package`} className="h-14 w-14 shrink-0 border border-border" onOpen={() => setSelectedScan(scan)} />
                        <div className="min-w-0"><strong className="block truncate">{scan.medicine}</strong><span className="block text-xs font-semibold text-primary">{scan.id}</span><span className="block max-w-[180px] truncate text-xs text-muted-foreground" title={scan.imageLabel}>{scan.imageLabel}</span></div>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={scan.result} /></TableCell>
                    <TableCell className="min-w-40"><ConfidenceProgress value={scan.confidence} status={scan.result} /></TableCell>
                    <TableCell>{scan.pharmacist}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{formatDateTime(scan.createdAt || scan.dateTime)}</TableCell>
                    <TableCell className="text-sm">{scan.reviewStatus}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedScan(scan)}>View details</Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === scan.id}
                          onClick={() => removeScan(scan)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === scan.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && !error && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10">
                      <EmptyState
                        Icon={Search}
                        title={scanHistory.length ? "No matching scans" : "No scan history yet"}
                        description={scanHistory.length ? "Clear the filters or search by a different medicine or scan ID." : "Authenticate a medicine image and saved database records will appear here."}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Showing {filtered.length} of {scanHistory.length} records</p>
        </CardContent>
      </Card>
      <Dialog open={Boolean(selectedScan)} onOpenChange={(open) => !open && setSelectedScan(null)}>
        {selectedScan && (
          <DialogContent className="w-[min(94vw,920px)] max-w-none">
            <DialogHeader>
              <DialogTitle>{selectedScan.id}</DialogTitle>
              <DialogDescription>{selectedScan.medicine} scan details.</DialogDescription>
            </DialogHeader>
            <ScanDetail scan={selectedScan} />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function ScanDetail({ scan }: { scan: ScanRecord }) {
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
      <div>
        <MedicineScanImage scanId={scan.id} hasImage={scan.hasImage} alt={`${scan.medicine} uploaded package`} className="h-[320px] w-full border border-border bg-slate-50 [&_img]:object-contain" />
        <p className="mt-2 truncate text-xs text-muted-foreground" title={scan.imageLabel}><strong>Original file:</strong> {scan.imageLabel}</p>
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2">
        <Detail label="Scan ID" value={scan.id} />
        <Detail label="Prediction" value={scan.result} />
        <Detail label="Model Prediction" value={scan.modelPrediction} />
        <Detail label="Confidence" value={`${(scan.confidence * 100).toFixed(1)}%`} />
        <Detail label="Fake Score" value={`${(scan.fakeScore * 100).toFixed(1)}%`} />
        <Detail label="Real Score" value={`${(scan.realScore * 100).toFixed(1)}%`} />
        <Detail label="Pharmacist" value={scan.pharmacist} />
        <Detail label="Scanned at" value={formatDateTime(scan.createdAt || scan.dateTime)} />
        <Detail label="Review Status" value={scan.reviewStatus} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted p-3"><p className="text-xs font-bold uppercase text-muted-foreground">{label}</p><strong>{value}</strong></div>;
}
