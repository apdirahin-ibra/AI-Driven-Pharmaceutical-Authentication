import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
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
import { useScanRecords } from "@/hooks/useRecords";
import type { PredictionStatus, ScanRecord } from "@/types/domain";

export function HistoryPage() {
  const { records: scanHistory, isLoading, error } = useScanRecords();
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<"All" | PredictionStatus>("All");
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);

  const filtered = useMemo(() => scanHistory.filter((scan) => {
    const matchesQuery = `${scan.id} ${scan.medicine} ${scan.imageLabel}`.toLowerCase().includes(query.toLowerCase());
    const matchesResult = resultFilter === "All" || scan.result === resultFilter;
    return matchesQuery && matchesResult;
  }), [scanHistory, query, resultFilter]);

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
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px_220px_52px]">
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
            <Button variant="outline" className="justify-start"><CalendarDays className="h-4 w-4" /> Jul 1 - Jul 7, 2026</Button>
            <Button variant="outline" size="icon" aria-label="More filters"><SlidersHorizontal className="h-4 w-4" /></Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <Table>
              <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Result</TableHead><TableHead>Confidence</TableHead><TableHead>Model</TableHead><TableHead>Pharmacist</TableHead><TableHead>Date and Time</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
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
                        {scan.imageDataUrl ? (
                          <img src={scan.imageDataUrl} alt="" className="h-12 w-16 rounded-lg border border-border object-cover" />
                        ) : (
                          <span className="grid h-12 w-16 place-items-center rounded-lg border border-border bg-blue-50 text-xs font-bold text-primary">{scan.medicine.slice(0, 2).toUpperCase()}</span>
                        )}
                        <div><strong className="block">{scan.medicine}</strong><span className="text-xs text-muted-foreground">{scan.imageLabel}</span></div>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={scan.result} /></TableCell>
                    <TableCell className="min-w-40"><ConfidenceProgress value={scan.confidence} status={scan.result} /></TableCell>
                    <TableCell>{scan.model}</TableCell>
                    <TableCell>{scan.pharmacist}</TableCell>
                    <TableCell>{scan.dateTime}</TableCell>
                    <TableCell><Button variant="outline" size="sm" onClick={() => setSelectedScan(scan)}>View</Button></TableCell>
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
          <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {filtered.length} of {scanHistory.length} records</span>
            <div className="flex items-center gap-2"><Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm">1</Button><Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button></div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={Boolean(selectedScan)} onOpenChange={(open) => !open && setSelectedScan(null)}>
        {selectedScan && (
          <DialogContent>
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
      <div className="grid gap-4">
      {scan.imageDataUrl ? (
        <img src={scan.imageDataUrl} alt="" className="h-56 w-full rounded-2xl border border-border object-contain bg-slate-50" />
      ) : (
        <div className="grid h-36 place-items-center rounded-2xl border border-border bg-blue-50 text-2xl font-black text-primary">{scan.medicine}</div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Detail label="Prediction" value={scan.result} />
        <Detail label="Model Prediction" value={scan.modelPrediction} />
        <Detail label="Confidence" value={`${(scan.confidence * 100).toFixed(1)}%`} />
        <Detail label="Fake Score" value={`${(scan.fakeScore * 100).toFixed(1)}%`} />
        <Detail label="Real Score" value={`${(scan.realScore * 100).toFixed(1)}%`} />
        <Detail label="Pharmacist" value={scan.pharmacist} />
        <Detail label="Date and Time" value={scan.dateTime} />
        <Detail label="Review Status" value={scan.reviewStatus} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted p-3"><p className="text-xs font-bold uppercase text-muted-foreground">{label}</p><strong>{value}</strong></div>;
}
