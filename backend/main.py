from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

try:
    from backend.services.data_service import DataService
    import backend.services.data_service as ds
    from backend.api import endpoints
except ModuleNotFoundError:
    # Fallback for Render if the Root Directory is set to 'backend'
    from services.data_service import DataService
    import services.data_service as ds
    from api import endpoints

app = FastAPI(title="Parking Operational Intelligence Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "Artifacts")

@app.on_event("startup")
def startup_event():
    ds.data_service = DataService(ARTIFACTS_DIR)

app.include_router(endpoints.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Parking Operational Intelligence Platform API"}
