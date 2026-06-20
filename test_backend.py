import os
import sys

from backend.services.data_service import DataService

ARTIFACTS_DIR = os.path.join(os.path.abspath("backend"), "Artifacts")

ds = DataService(ARTIFACTS_DIR)

try:
    print("Testing get_hotspot_master...")
    res = ds.get_hotspot_master()
    print("Length:", len(res))

    print("Testing get_forecast_data...")
    res2 = ds.get_forecast_data()
    print("Length predictions:", len(res2["predictions"]))
    
    print("Testing get_archetypes...")
    res3 = ds.get_archetypes()
    print("Length archetypes:", len(res3))
    
    import json
    # Let's try to serialize to JSON to catch NaN errors
    json.dumps(res2)
    print("JSON serialization passed for forecast data.")
    
except Exception as e:
    import traceback
    traceback.print_exc()
