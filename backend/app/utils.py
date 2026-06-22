"""Ortak yardımcı fonksiyonlar."""
from datetime import datetime, timezone
import secrets
import string

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException


def oid(id_str: str) -> ObjectId:
    """String ID'yi MongoDB ObjectId'ye çevirir; geçersizse 400 döner."""
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail=f"Geçersiz ID formatı: {id_str}")


def serialize(doc):
    """MongoDB dökümanını JSON-uyumlu hale getirir (_id -> id string)."""
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


def gen_pnr() -> str:
    """6 karakterlik benzersiz PNR kodu üretir (ör. 'A3F9K2')."""
    return "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
