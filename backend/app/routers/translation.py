import os
import deepl

from pathlib import Path
from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel

env_path = Path(__file__).resolve().parents[2] / ".env"

print("ENV PATH =", env_path)
print("ENV EXISTS =", env_path.exists())

load_dotenv(env_path)

router = APIRouter(
    prefix="/translate",
    tags=["Translation"]
)

api_key = os.getenv("DEEPL_API_KEY")

print("DEEPL_API_KEY =", api_key)

translator = (
    deepl.Translator(api_key)
    if api_key
    else None
)

class TranslationRequest(BaseModel):
    texts: list[str]
    target_lang: str


@router.post("/")
def translate(request: TranslationRequest):
    if translator is None:
        return {
            "error": "DEEPL_API_KEY not configured"
        }

    result = translator.translate_text(
        request.texts,
        target_lang=request.target_lang
    )

    return {
        "translations": [
            item.text for item in result
        ]
    }


@router.get("/status")
def status():
    return {
        "configured": translator is not None,
        "api_key": api_key,
    }