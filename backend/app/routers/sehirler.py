"""Şehir uç noktaları."""
from fastapi import APIRouter

from ..database import col
from ..utils import serialize

router = APIRouter(prefix="/api/sehirler", tags=["Şehirler (Cities)"])


@router.get("", summary="[1] Tüm şehirleri listele")
async def list_sehirler():
    """Kalkış/varış seçimi için şehir listesini döner."""
    docs = [serialize(d) async for d in col("sehirler").find().sort("ad", 1)]
    return {"adet": len(docs), "sehirler": docs}
