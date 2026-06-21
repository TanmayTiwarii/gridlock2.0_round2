from fastapi import APIRouter, HTTPException, Query, Response
try:
    import backend.services.data_service as ds
except ModuleNotFoundError:
    import services.data_service as ds
import json

router = APIRouter()

@router.get("/kpis")
def get_kpis():
    service = ds.get_data_service()
    data = service.get_kpis()
    if not data or data == "{}":
        raise HTTPException(status_code=404, detail="KPIs not found")
    return Response(content=data, media_type="application/json")

@router.get("/hotspots")
def get_hotspots():
    service = ds.get_data_service()
    if not service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return Response(content=service.get_hotspot_master(), media_type="application/json")

@router.get("/geojson")
def get_geojson():
    service = ds.get_data_service()
    data = service.get_geojson()
    if not data or data == "{}":
        raise HTTPException(status_code=404, detail="GeoJSON not found")
    return Response(content=data, media_type="application/json")

@router.get("/forecast")
def get_forecast():
    service = ds.get_data_service()
    if not service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return Response(content=service.get_forecast_data(), media_type="application/json")

@router.get("/archetypes")
def get_archetypes():
    service = ds.get_data_service()
    if not service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return Response(content=service.get_archetypes(), media_type="application/json")

@router.get("/network")
def get_network():
    service = ds.get_data_service()
    if not service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return Response(content=service.get_network_graph(), media_type="application/json")

@router.get("/search")
def search(query: str = Query(..., min_length=1), top_k: int = Query(10, gt=0, le=50)):
    service = ds.get_data_service()
    if not service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    
    results = service.semantic_search(query, top_k)
    return {"results": results}

@router.head("/health")
def health_check():
    return {"status": "ok"}
