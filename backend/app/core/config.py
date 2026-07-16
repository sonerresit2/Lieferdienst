from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Wird per docker-compose.yml als Umgebungsvariable gesetzt.
    database_url: str = (
        "postgresql://lieferdienst:lieferdienst@localhost:5432/lieferdienst"
    )

    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    deepl_api_key: str | None = None

    class Config:
        env_file = ".env"


settings = Settings()
