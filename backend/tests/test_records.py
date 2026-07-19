import pytest

from app.records import SupabaseRecordStore, owns_record, sanitize_file_name


def test_owner_id_is_canonical_record_owner() -> None:
    row = {"pharmacist_id": "user-1", "pharmacist": "Shared Name"}
    assert owns_record(row, "user-1", "Different Name") is True
    assert owns_record(row, "user-2", "Shared Name") is False


def test_legacy_record_without_owner_id_is_admin_only() -> None:
    row = {"pharmacist_id": None, "pharmacist": "Test Pharmacist"}
    assert owns_record(row, "user-1", "test pharmacist") is False


def test_storage_file_name_is_sanitized_and_uses_validated_extension() -> None:
    assert sanitize_file_name("2025 09 17 174538.weird", "image/png") == "2025-09-17-174538.png"


def test_delete_scan_removes_database_record_and_storage_object(monkeypatch) -> None:
    store = SupabaseRecordStore("https://example.supabase.co", "service-key")
    database_calls = []
    storage_calls = []

    def request(method, path, *, params=None, json=None, prefer_return=False):
        database_calls.append((method, path, params, prefer_return))
        if method == "GET":
            return [{
                "id": "PG-1",
                "image_label": "medicine.jpg",
                "image_bucket": "medicine-scans",
                "image_path": "user-1/2026/07/PG-1/medicine.jpg",
                "image_data_url": None,
                "pharmacist": "Test Pharmacist",
                "pharmacist_id": "user-1",
            }]
        return [{"id": "PG-1"}]

    monkeypatch.setattr(store, "_request", request)
    monkeypatch.setattr(
        store,
        "_storage_request",
        lambda method, path, **_: storage_calls.append((method, path)),
    )

    store.delete_scan("PG-1", "user-1", "Test Pharmacist", False)

    assert database_calls[-1] == (
        "DELETE",
        "/scan_records",
        {"id": "eq.PG-1"},
        True,
    )
    assert storage_calls == [
        ("DELETE", "/object/medicine-scans/user-1/2026/07/PG-1/medicine.jpg")
    ]


def test_pharmacist_cannot_delete_another_users_scan(monkeypatch) -> None:
    store = SupabaseRecordStore("https://example.supabase.co", "service-key")

    monkeypatch.setattr(
        store,
        "_request",
        lambda *_args, **_kwargs: [{
            "id": "PG-2",
            "image_label": "medicine.jpg",
            "image_bucket": None,
            "image_path": None,
            "image_data_url": None,
            "pharmacist": "Other Pharmacist",
            "pharmacist_id": "user-2",
        }],
    )

    with pytest.raises(PermissionError):
        store.delete_scan("PG-2", "user-1", "Test Pharmacist", False)
