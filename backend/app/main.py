from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import Base, engine
from app.core.error_handlers import register_exception_handlers
from app.routers import products, product_images, vendors, auth, cart, orders

# Erstellt alle Tabellen aus den Models, falls sie noch nicht existieren.
# Für ein Schulprojekt ausreichend; in größeren Projekten würde man hierfür
# Alembic-Migrationen verwenden (im Repo bereits als Dependency vorbereitet).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lieferdienst API",
    description="Backend für die Food-Delivery-Plattform (Produkte, Auth, Warenkorb, Bestellungen).",
    version="1.0.0",
)

register_exception_handlers(app)

# CORS: erlaubt dem Frontend-Team, die API vom Browser aus anzusprechen.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Für die Schulprojekt-Umgebung offen; in Produktion einschränken.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth.router)
app.include_router(vendors.router)
app.include_router(products.router)
app.include_router(product_images.router)
app.include_router(cart.router)
app.include_router(orders.router)


@app.get("/", tags=["Status"])
def root():
    return {"status": "ok", "service": "Lieferdienst API"}


@app.get("/health", tags=["Status"])
def health_check():
    return {"status": "healthy"}
