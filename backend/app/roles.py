from typing import Literal


UserRole = Literal["Admin", "Pharmacist"]


def normalize_role(value: object) -> UserRole:
    normalized = str(value or "").strip().lower()
    if normalized == "admin":
        return "Admin"
    if normalized in {"pharmacist", "pharmacy", "pharmacies"}:
        return "Pharmacist"
    return "Pharmacist"
