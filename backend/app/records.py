from __future__ import annotations

import logging
from time import sleep
from datetime import datetime
from secrets import token_hex
from typing import Literal

import httpx
from pydantic import BaseModel, Field


PredictionStatus = Literal["Real", "Fake", "Suspicious"]
ModelPrediction = Literal["Real", "Fake"]
RiskStatus = Literal["Open", "Under Review", "Resolved"]
REQUEST_TIMEOUT_SECONDS = 20
REQUEST_ATTEMPTS = 3
RETRYABLE_HTTP_STATUSES = {429, 500, 502, 503, 504}
logger = logging.getLogger(__name__)
SCAN_LIST_COLUMNS = (
    "id,medicine,image_label,result,model_prediction,confidence,fake_score,"
    "real_score,model,pharmacist,date_time,review_status,created_at"
)
REPORT_LIST_COLUMNS = (
    "id,scan_id,medicine,image_label,ai_result,model_prediction,confidence,"
    "fake_score,real_score,pharmacist,scan_date,status,notes,created_at"
)


class PredictionScores(BaseModel):
    Fake: float
    Real: float


class PredictionValidation(BaseModel):
    status: str
    code: str
    supported_domain: str
    message: str | None = None


class PredictionPayload(BaseModel):
    prediction: PredictionStatus
    model_prediction: ModelPrediction
    confidence: float
    scores: PredictionScores
    validation: PredictionValidation | None = None


class NewScanRequest(BaseModel):
    prediction: PredictionPayload
    file_name: str = Field(alias="fileName")
    image_data_url: str | None = Field(default=None, alias="imageDataUrl")


class UpdateRiskReportRequest(BaseModel):
    status: RiskStatus
    notes: str | None = None


class SupabaseNotConfiguredError(RuntimeError):
    pass


class SupabaseRecordsError(RuntimeError):
    pass


class SupabaseRecordStore:
    def __init__(self, supabase_url: str | None, service_role_key: str | None) -> None:
        self.supabase_url = supabase_url
        self.service_role_key = service_role_key

    @property
    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.service_role_key)

    def list_scans(self) -> list[dict]:
        rows = self._request(
            "GET",
            "/scan_records",
            params={"select": SCAN_LIST_COLUMNS, "order": "created_at.desc"},
        )
        return [scan_from_row(row) for row in rows]

    def list_reports(self) -> list[dict]:
        rows = self._request(
            "GET",
            "/risk_reports",
            params={"select": REPORT_LIST_COLUMNS, "order": "created_at.desc"},
        )
        return [report_from_row(row) for row in rows]

    def ping(self) -> dict:
        rows = self._request("GET", "/scan_records", params={"select": "id", "limit": "1"})
        return {"ok": True, "rows_sampled": len(rows)}

    def create_scan(self, request: NewScanRequest, pharmacist: str) -> dict:
        now = datetime.now()
        rejected_upload = (
            request.prediction.prediction == "Suspicious"
            and request.prediction.validation is not None
            and request.prediction.validation.status == "rejected"
        )
        scan = {
            "id": create_record_id("PG", now),
            "medicine": "Unsupported Upload" if rejected_upload else derive_medicine_name(request.file_name),
            "image_label": request.file_name,
            "image_data_url": request.image_data_url,
            "result": request.prediction.prediction,
            "model_prediction": request.prediction.model_prediction,
            "confidence": request.prediction.confidence,
            "fake_score": request.prediction.scores.Fake,
            "real_score": request.prediction.scores.Real,
            "model": "Input Validator" if rejected_upload else "Improved CNN",
            "pharmacist": pharmacist,
            "date_time": format_date_time(now),
            "review_status": "Unsupported image" if rejected_upload else review_status_for(request.prediction.prediction),
        }
        rows = self._request("POST", "/scan_records", json=scan, prefer_return=True)
        created_scan = rows[0] if rows else scan

        if created_scan["result"] != "Real":
            self._request(
                "POST",
                "/risk_reports",
                json=create_risk_report(created_scan, now),
                prefer_return=True,
            )

        return scan_from_row(created_scan)

    def update_report(self, report_id: str, request: UpdateRiskReportRequest) -> list[dict]:
        payload = {"status": request.status, "updated_at": datetime.utcnow().isoformat()}
        if request.notes is not None:
            payload["notes"] = request.notes
        self._request(
            "PATCH",
            "/risk_reports",
            params={"id": f"eq.{report_id}"},
            json=payload,
            prefer_return=True,
        )
        return self.list_reports()

    def _request(
        self,
        method: str,
        table_path: str,
        *,
        params: dict[str, str] | None = None,
        json: dict | None = None,
        prefer_return: bool = False,
    ):
        if not self.is_configured:
            raise SupabaseNotConfiguredError(
                "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env."
            )

        headers = {
            "apikey": self.service_role_key or "",
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json",
        }
        if prefer_return:
            headers["Prefer"] = "return=representation"

        response = self._send_request(method, table_path, params=params, json=json, headers=headers)

        if response.status_code == 204 or not response.content:
            return []
        return response.json()

    def _send_request(
        self,
        method: str,
        table_path: str,
        *,
        params: dict[str, str] | None,
        json: dict | None,
        headers: dict[str, str],
    ) -> httpx.Response:
        timeout = httpx.Timeout(REQUEST_TIMEOUT_SECONDS, connect=10)
        last_error: httpx.HTTPError | None = None
        for attempt in range(REQUEST_ATTEMPTS):
            try:
                response = httpx.request(
                    method,
                    f"{self.supabase_url}/rest/v1{table_path}",
                    params=params,
                    json=json,
                    headers=headers,
                    timeout=timeout,
                )
                if response.status_code in RETRYABLE_HTTP_STATUSES and attempt < REQUEST_ATTEMPTS - 1:
                    logger.warning(
                        "Supabase records request returned retryable status %s on attempt %s/%s.",
                        response.status_code,
                        attempt + 1,
                        REQUEST_ATTEMPTS,
                    )
                    sleep(0.75 * (attempt + 1))
                    continue
                response.raise_for_status()
                return response
            except httpx.HTTPStatusError as exc:
                raise SupabaseRecordsError(f"Supabase request failed with status {exc.response.status_code}.") from exc
            except httpx.HTTPError as exc:
                last_error = exc
                logger.warning(
                    "Supabase records request failed on attempt %s/%s: %s",
                    attempt + 1,
                    REQUEST_ATTEMPTS,
                    type(exc).__name__,
                )
                if attempt < REQUEST_ATTEMPTS - 1:
                    sleep(0.75 * (attempt + 1))
        assert last_error is not None
        raise SupabaseRecordsError(f"Supabase request failed: {last_error}") from last_error


def create_record_id(prefix: str, date: datetime) -> str:
    return f"{prefix}-{date:%y%m}-{token_hex(3).upper()}"


def create_risk_report(scan: dict, now: datetime) -> dict:
    unsupported_upload = scan.get("review_status") == "Unsupported image"
    return {
        "id": create_record_id("RISK", now),
        "scan_id": scan["id"],
        "medicine": scan["medicine"],
        "image_label": scan["image_label"],
        "image_data_url": scan.get("image_data_url"),
        "ai_result": "Suspicious" if scan["result"] == "Real" else scan["result"],
        "model_prediction": scan["model_prediction"],
        "confidence": scan["confidence"],
        "fake_score": scan["fake_score"],
        "real_score": scan["real_score"],
        "pharmacist": scan["pharmacist"],
        "scan_date": scan["date_time"],
        "status": "Open" if scan["result"] == "Fake" else "Under Review",
        "notes": risk_report_notes(scan, unsupported_upload),
    }


def risk_report_notes(scan: dict, unsupported_upload: bool) -> str:
    if unsupported_upload:
        return (
            "Unsupported image uploaded. The AI authenticity model was not run because the image "
            "is outside the supported medicine-packaging domain."
        )
    if scan["result"] == "Fake":
        return "Potential fake medicine detected. Manual verification recommended before sale or use."
    return "Confidence was below the 75% decision threshold."


def scan_from_row(row: dict) -> dict:
    return {
        "id": row["id"],
        "medicine": row["medicine"],
        "imageLabel": row["image_label"],
        "imageDataUrl": row.get("image_data_url"),
        "result": row["result"],
        "modelPrediction": row["model_prediction"],
        "confidence": row["confidence"],
        "fakeScore": row["fake_score"],
        "realScore": row["real_score"],
        "model": row["model"],
        "pharmacist": row["pharmacist"],
        "dateTime": row["date_time"],
        "reviewStatus": row["review_status"],
    }


def report_from_row(row: dict) -> dict:
    return {
        "id": row["id"],
        "scanId": row["scan_id"],
        "medicine": row["medicine"],
        "imageLabel": row["image_label"],
        "imageDataUrl": row.get("image_data_url"),
        "aiResult": row["ai_result"],
        "modelPrediction": row["model_prediction"],
        "confidence": row["confidence"],
        "fakeScore": row["fake_score"],
        "realScore": row["real_score"],
        "pharmacist": row["pharmacist"],
        "scanDate": row["scan_date"],
        "status": row["status"],
        "notes": row["notes"],
    }


def review_status_for(prediction: PredictionStatus) -> str:
    if prediction == "Real":
        return "Verified"
    if prediction == "Fake":
        return "Needs review"
    return "Manual review"


def format_date_time(date: datetime) -> str:
    hour = date.hour % 12 or 12
    return f"{date:%b} {date.day}, {date.year} {hour}:{date.minute:02d} {date:%p}"


def derive_medicine_name(file_name: str) -> str:
    clean = file_name.rsplit(".", 1)[0]
    for token in ("screenshot", "image", "photo", "medicine", "package"):
        clean = clean.replace(token, "").replace(token.title(), "")
    clean = " ".join(clean.replace("_", " ").replace("-", " ").split())
    if not clean or clean.isdigit():
        return "Uploaded Medicine Image"
    return " ".join(part[:1].upper() + part[1:] for part in clean.split()[:4])
