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
        # We no longer store massive datasets in memory to prevent OOM
        self.semantic_index_data = None
        
        self.faiss_index = None
        self.model = None

        self._load_data()

    def _load_csv_to_json_str(self, filename: str):
        path = os.path.join(self.artifacts_dir, filename)
        if os.path.exists(path):
            # to_json automatically translates NaN to null and runs in optimized C
            return pd.read_csv(path).to_json(orient='records')
        return "[]"

    def _load_csv_to_dict(self, filename: str):
        path = os.path.join(self.artifacts_dir, filename)
        if os.path.exists(path):
            df = pd.read_csv(path)
            records = df.to_dict(orient='records')
            import math
            for r in records:
                for k, v in r.items():
                    if isinstance(v, float) and math.isnan(v):
                        r[k] = None
            return records
        return []

    def _load_data(self):
        print("Loading backend datasets...")
        
        # ONLY load what is absolutely necessary for fast AI search
        # Everything else will be lazily loaded from disk when requested
        print("Preloading only Semantic Search index...")

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
        metadata_path = os.path.join(self.artifacts_dir, 'dashboard_metadata.json')
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r', encoding='utf-8') as f:
                return f.read()
        return "{}"
        
    def get_hotspot_master(self):
        return self._load_csv_to_json_str('hotspot_master.csv')

    def get_geojson(self):
        geojson_path = os.path.join(self.artifacts_dir, 'hotspots.geojson')
        if os.path.exists(geojson_path):
            with open(geojson_path, 'r', encoding='utf-8') as f:
                return f.read()
        return "{}"

    def get_forecast_data(self):
        preds = self._load_csv_to_json_str('valid_predictions.csv')
        ts = self._load_csv_to_json_str('hotspot_timeseries.csv')
        return f'{{"predictions": {preds}, "timeseries": {ts}}}'

    def get_archetypes(self):
        return self._load_csv_to_json_str('archetype_profiles.csv')

    def get_network_graph(self):
        nodes = self._load_csv_to_json_str('graph_nodes.csv')
        edges = self._load_csv_to_json_str('graph_edges.csv')
        return f'{{"nodes": {nodes}, "edges": {edges}}}'

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
