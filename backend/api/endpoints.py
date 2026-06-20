from fastapi import APIRouter, HTTPException, Query
try:
    import backend.services.data_service as ds
except ModuleNotFoundError:
    import services.data_service as ds
import json

router = APIRouter()

@router.get("/kpis")
def get_kpis():
    service = ds.get_data_service()
    if not service or not service.kpi_metadata:
        raise HTTPException(status_code=404, detail="KPIs not found")
    return service.kpi_metadata

@router.get("/hotspots")
def get_hotspots():
    service = ds.get_data_service()
    if not service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return service.get_hotspot_master()

@router.get("/geojson")
def get_geojson():
    service = ds.get_data_service()
    if not service or not service.hotspots_geojson:
        raise HTTPException(status_code=404, detail="GeoJSON not found")
    return service.get_geojson()

@router.get("/forecast")
def get_forecast():
    service = ds.get_data_service()
    if not service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return service.get_forecast_data()

@router.get("/archetypes")
def get_archetypes():
    service = ds.get_data_service()
    if not service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return service.get_archetypes()

@router.get("/network")
def get_network():
    service = ds.get_data_service()
    if not service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return service.get_network_graph()

@router.get("/search")
def search(query: str = Query(..., min_length=1), top_k: int = Query(10, gt=0, le=50)):
    service = ds.get_data_service()
    if not service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    
    results = service.semantic_search(query, top_k)
    return {"results": results}
