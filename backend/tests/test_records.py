from app.records import owns_record, sanitize_file_name


def test_owner_id_is_canonical_record_owner() -> None:
    row = {"pharmacist_id": "user-1", "pharmacist": "Shared Name"}
    assert owns_record(row, "user-1", "Different Name") is True
    assert owns_record(row, "user-2", "Shared Name") is False


def test_legacy_record_without_owner_id_is_admin_only() -> None:
    row = {"pharmacist_id": None, "pharmacist": "Test Pharmacist"}
    assert owns_record(row, "user-1", "test pharmacist") is False


def test_storage_file_name_is_sanitized_and_uses_validated_extension() -> None:
    assert sanitize_file_name("2025 09 17 174538.weird", "image/png") == "2025-09-17-174538.png"
