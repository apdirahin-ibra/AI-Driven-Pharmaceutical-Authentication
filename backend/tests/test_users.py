import pytest

from app.users import CreateUserRequest, SupabaseUserAdmin, SupabaseUserAdminError


def managed_user(user_id: str = "user-1", role: str = "Pharmacist") -> dict:
    return {
        "id": user_id,
        "email": "user@example.com",
        "fullName": "Test User",
        "role": role,
        "createdAt": None,
        "lastSignInAt": None,
    }


def test_uncertain_create_response_recovers_created_user(monkeypatch) -> None:
    admin = SupabaseUserAdmin("https://supabase.example", "service-key")
    list_results = [[], [managed_user()]]
    monkeypatch.setattr(admin, "list_users", lambda: list_results.pop(0))

    def uncertain(*args, **kwargs):
        raise SupabaseUserAdminError(
            "Supabase Auth did not return a reliable response.",
            code="USER_ADMIN_UNAVAILABLE",
            status_code=503,
            retryable=True,
        )

    monkeypatch.setattr(admin, "_request", uncertain)
    result = admin.create_user(
        CreateUserRequest(email="USER@example.com", password="Temporary123", fullName="Test User", role="Pharmacist")
    )
    assert result["id"] == "user-1"


def test_existing_email_is_rejected_before_create(monkeypatch) -> None:
    admin = SupabaseUserAdmin("https://supabase.example", "service-key")
    monkeypatch.setattr(admin, "list_users", lambda: [managed_user()])
    with pytest.raises(SupabaseUserAdminError) as exc:
        admin.create_user(
            CreateUserRequest(email="user@example.com", password="Temporary123", fullName="Test User", role="Pharmacist")
        )
    assert exc.value.code == "DUPLICATE_EMAIL"


def test_final_admin_cannot_be_deleted_or_demoted(monkeypatch) -> None:
    admin = SupabaseUserAdmin("https://supabase.example", "service-key")
    monkeypatch.setattr(admin, "list_users", lambda: [managed_user("admin-1", "Admin")])
    with pytest.raises(SupabaseUserAdminError) as exc:
        admin.ensure_admin_continuity("admin-1", None)
    assert exc.value.code == "FINAL_ADMIN_REQUIRED"
