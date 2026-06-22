"""Pydantic istek/yanıt şemaları (Swagger dokümantasyonunu da besler)."""
from typing import Optional

from pydantic import BaseModel, Field


class SeferCreate(BaseModel):
    kalkis: str = Field(..., examples=["İstanbul"], description="Kalkış şehri")
    varis: str = Field(..., examples=["Ankara"], description="Varış şehri")
    tarih: str = Field(..., examples=["2026-06-25"], description="Sefer tarihi (YYYY-AA-GG)")
    saat: str = Field(..., examples=["09:00"], description="Kalkış saati")
    firma: str = Field("Obilet Turizm", description="Otobüs firması")
    otobus_tipi: str = Field("2+1", description="Koltuk düzeni")
    fiyat: float = Field(..., examples=[450.0], description="Bilet fiyatı (TL)")
    toplam_koltuk: int = Field(40, ge=10, le=60, description="Toplam koltuk sayısı")
    sure: str = Field("5s 30dk", description="Tahmini yolculuk süresi")


class YolcuCreate(BaseModel):
    ad: str = Field(..., examples=["Ahmet"])
    soyad: str = Field(..., examples=["Yılmaz"])
    tc: str = Field(..., min_length=11, max_length=11, examples=["12345678901"], description="TC Kimlik No (11 hane)")
    telefon: str = Field(..., examples=["05551112233"])
    email: Optional[str] = Field("", examples=["ahmet@example.com"])
    cinsiyet: str = Field("Belirtilmedi", examples=["Erkek", "Kadın"])


class BiletCreate(BaseModel):
    sefer_id: str = Field(..., description="Satın alınacak seferin ID'si")
    koltuk_no: int = Field(..., ge=1, le=60, description="Seçilen koltuk numarası")
    yolcu_id: Optional[str] = Field(None, description="Kayıtlı yolcu ID'si (opsiyonel)")
    ad: Optional[str] = Field(None, description="Yolcu adı (yolcu_id yoksa)")
    soyad: Optional[str] = Field(None, description="Yolcu soyadı (yolcu_id yoksa)")
