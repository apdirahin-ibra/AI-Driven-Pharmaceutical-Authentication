import { useMemo, useState } from "react";
import { FileText, ShieldAlert, TriangleAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RiskStatusBadge } from "@/components/shared/RiskStatusBadge";
import { MetricCard } from "@/components/shared/MetricCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { updateRiskReport } from "@/api/records";
import { useRiskReports } from "@/hooks/useRecords";
import type { RiskReport, RiskStatus } from "@/types/domain";

export function ReportsPage() {
  const { records: reports, isLoading, error } = useRiskReports();
  const [selectedReport, setSelectedReport] = useState<RiskReport | null>(null);

  const counts = useMemo(() => ({
    open: reports.filter((report) => report.status === "Open").length,
    fake: reports.filter((report) => report.aiResult === "Fake").length,
    suspicious: reports.filter((report) => report.aiResult === "Suspicious").length,
    resolved: reports.filter((report) => report.status === "Resolved").length,
  }), [reports]);

  const updateReport = async (id: string, status: RiskStatus, notes?: string) => {
    await updateRiskReport(id, status, notes);
    setSelectedReport((current) => current && current.id === id ? { ...current, status, notes: notes ?? current.notes } : current);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Risk Reports"
        title="Medicine Risk Reporting"
        description="Review Fake and Suspicious AI assessments and manage database-backed report statuses."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Reports" value={counts.open} detail="Awaiting review" Icon={FileText} />
        <MetricCard label="Fake Detections" value={counts.fake} detail="Potential fake cases" Icon={ShieldAlert} tone="fake" />
        <MetricCard label="Suspicious Reviews" value={counts.suspicious} detail="Manual review needed" Icon={TriangleAlert} tone="suspicious" />
        <MetricCard label="Resolved Cases" value={counts.resolved} detail="Marked resolved" Icon={CheckCircle2} tone="real" />
      </div>
      <Card className="mt-5">
        <CardHeader><CardTitle>Report Table</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {error && <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription></Alert>}
          <Table>
            <TableHeader><TableRow><TableHead>Case ID</TableHead><TableHead>Medicine Image</TableHead><TableHead>AI Result</TableHead><TableHead>Confidence</TableHead><TableHead>Pharmacist</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Loading risk reports...</TableCell>
                </TableRow>
              )}
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-semibold">{report.id}</TableCell>
                  <TableCell><div><strong>{report.medicine}</strong><p className="text-xs text-muted-foreground">{report.imageLabel}</p></div></TableCell>
                  <TableCell><StatusBadge status={report.aiResult} /></TableCell>
                  <TableCell>{(report.confidence * 100).toFixed(1)}%</TableCell>
                  <TableCell>{report.pharmacist}</TableCell>
                  <TableCell><RiskStatusBadge status={report.status} /></TableCell>
                  <TableCell>{report.scanDate}</TableCell>
                  <TableCell><Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>Open</Button></TableCell>
                </TableRow>
              ))}
              {!isLoading && !error && reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10">
                    <EmptyState
                      Icon={FileText}
                      title="No risk reports yet"
                      description="Fake and suspicious scan results will automatically create database-backed risk reports here."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={Boolean(selectedReport)} onOpenChange={(open) => !open && setSelectedReport(null)}>
        {selectedReport && (
          <SheetContent className="w-[min(92vw,560px)] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedReport.id}</SheetTitle>
              <SheetDescription>{selectedReport.medicine} risk report.</SheetDescription>
            </SheetHeader>
            <ReportDetail report={selectedReport} onUpdate={updateReport} />
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}

function ReportDetail({ report, onUpdate }: { report: RiskReport; onUpdate: (id: string, status: RiskStatus, notes?: string) => void }) {
  const [notes, setNotes] = useState(report.notes);
  return (
    <div className="space-y-5">
      {report.imageDataUrl ? (
        <img src={report.imageDataUrl} alt="" className="h-56 w-full rounded-2xl border border-border object-contain bg-slate-50" />
      ) : (
        <div className="grid h-36 place-items-center rounded-2xl border border-border bg-blue-50 text-2xl font-black text-primary">{report.medicine}</div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Detail label="AI Result" value={report.aiResult} />
        <Detail label="Model Prediction" value={report.modelPrediction} />
        <Detail label="Confidence" value={`${(report.confidence * 100).toFixed(1)}%`} />
        <Detail label="Fake Score" value={`${(report.fakeScore * 100).toFixed(1)}%`} />
        <Detail label="Real Score" value={`${(report.realScore * 100).toFixed(1)}%`} />
        <Detail label="Pharmacist" value={report.pharmacist} />
        <Detail label="Scan Date" value={report.scanDate} />
        <Detail label="Report Status" value={report.status} />
      </div>
      <div>
        <label className="text-sm font-semibold">Review Notes</label>
        <Textarea className="mt-2" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Button variant="outline" onClick={() => onUpdate(report.id, "Under Review", notes)}>Mark Under Review</Button>
        <Button variant="outline" onClick={() => onUpdate(report.id, report.status, notes)}>Add Review Note</Button>
        <Button onClick={() => onUpdate(report.id, "Resolved", notes)}>Resolve Case</Button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted p-3"><p className="text-xs font-bold uppercase text-muted-foreground">{label}</p><strong>{value}</strong></div>;
}
