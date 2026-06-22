"""Yolcu uç noktaları."""
from fastapi import APIRouter, HTTPException

from ..database import col
from ..models import YolcuCreate
from ..utils import now_iso, serialize

router = APIRouter(prefix="/api/yolcular", tags=["Yolcular (Passengers)"])


@router.post("", status_code=201, summary="[5] Yolcu kaydı oluştur")
async def create_yolcu(yolcu: YolcuCreate):
    mevcut = await col("yolcular").find_one({"tc": yolcu.tc})
    if mevcut:
        raise HTTPException(409, f"Bu TC ile kayıtlı yolcu var: {yolcu.tc}")
    doc = yolcu.model_dump()
    doc["created_at"] = now_iso()
    res = await col("yolcular").insert_one(doc)
    created = await col("yolcular").find_one({"_id": res.inserted_id})
    return serialize(created)


@router.get("", summary="[6] Yolcuları listele")
async def list_yolcular():
    docs = [serialize(d) async for d in col("yolcular").find().sort("created_at", -1)]
    return {"adet": len(docs), "yolcular": docs}
