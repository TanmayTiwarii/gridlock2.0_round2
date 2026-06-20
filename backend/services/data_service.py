import os
import pandas as pd
import json
import numpy as np
# pyrefly: ignore [missing-import]
import faiss
from sentence_transformers import SentenceTransformer

class DataService:
    def __init__(self, artifacts_dir: str):
        self.artifacts_dir = artifacts_dir
        self.master_data = None
        self.kpi_metadata = None
        self.hotspots_geojson = None
        self.valid_predictions_data = None
        self.hotspot_timeseries_data = None
        self.archetype_profiles_data = None
        self.graph_nodes_data = None
        self.graph_edges_data = None
        self.semantic_index_data = None
        
        self.faiss_index = None
        self.model = None

        self._load_data()

    def _load_csv_to_dict(self, filename: str):
        path = os.path.join(self.artifacts_dir, filename)
        if os.path.exists(path):
            df = pd.read_csv(path)
            records = df.to_dict(orient='records')
            # Clean NaNs natively in Python without Pandas object overhead
            import math
            for r in records:
                for k, v in r.items():
                    if isinstance(v, float) and math.isnan(v):
                        r[k] = None
            return records
        return None

    def _load_data(self):
        print("Loading backend datasets...")
        
        # 1. hotspot_master.csv
        self.master_data = self._load_csv_to_dict('hotspot_master.csv')
        
        # 2. dashboard_metadata.json
        metadata_path = os.path.join(self.artifacts_dir, 'dashboard_metadata.json')
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                self.kpi_metadata = json.load(f)

        # 3. hotspots.geojson
        geojson_path = os.path.join(self.artifacts_dir, 'hotspots.geojson')
        if os.path.exists(geojson_path):
            with open(geojson_path, 'r', encoding='utf-8') as f:
                self.hotspots_geojson = json.load(f)

        # 4. valid_predictions.csv
        self.valid_predictions_data = self._load_csv_to_dict('valid_predictions.csv')

        # 5. hotspot_timeseries.csv
        self.hotspot_timeseries_data = self._load_csv_to_dict('hotspot_timeseries.csv')
        
        # 6. archetype_profiles.csv
        self.archetype_profiles_data = self._load_csv_to_dict('archetype_profiles.csv')

        # 7. graph_nodes.csv & graph_edges.csv
        self.graph_nodes_data = self._load_csv_to_dict('graph_nodes.csv')
        self.graph_edges_data = self._load_csv_to_dict('graph_edges.csv')

        # 8. Semantic Search: FAISS
        self.semantic_index_data = self._load_csv_to_dict('semantic_hotspot_index.csv')
        embed_path = os.path.join(self.artifacts_dir, 'hotspot_embeddings.npy')
        
        if self.semantic_index_data is not None and os.path.exists(embed_path):
            try:
                embeddings = np.load(embed_path)
                dimension = embeddings.shape[1]
                self.faiss_index = faiss.IndexFlatIP(dimension)
                faiss.normalize_L2(embeddings)
                self.faiss_index.add(embeddings)
                
                # We will lazily load SentenceTransformer model in semantic_search()
                # to save memory during server startup.
            except Exception as e:
                print(f"Error loading FAISS: {e}")

        print("Backend datasets loaded.")

    def get_kpis(self):
        return self.kpi_metadata
        
    def get_hotspot_master(self):
        return self.master_data if self.master_data is not None else []

    def get_geojson(self):
        return self.hotspots_geojson

    def get_forecast_data(self):
        return {
            "predictions": self.valid_predictions_data if self.valid_predictions_data is not None else [],
            "timeseries": self.hotspot_timeseries_data if self.hotspot_timeseries_data is not None else []
        }

    def get_archetypes(self):
        return self.archetype_profiles_data if self.archetype_profiles_data is not None else []

    def get_network_graph(self):
        return {
            "nodes": self.graph_nodes_data if self.graph_nodes_data is not None else [],
            "edges": self.graph_edges_data if self.graph_edges_data is not None else []
        }

    def semantic_search(self, query: str, top_k: int = 10):
        if not self.faiss_index or self.semantic_index_data is None:
            return []
            
        if self.model is None:
            print("Lazy loading SentenceTransformer model to save memory...")
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            
        query_emb = self.model.encode([query])
        faiss.normalize_L2(query_emb)
        
        distances, indices = self.faiss_index.search(query_emb, k=top_k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx < len(self.semantic_index_data):
                row = self.semantic_index_data[idx].copy()
                row["similarity_score"] = float(distances[0][i])
                results.append(row)
                
        return results

# A global instance to be initialized in main.py
data_service = None

def get_data_service():
    return data_service
