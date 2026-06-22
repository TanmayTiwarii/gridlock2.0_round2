
# Parking Operational Intelligence Platform (POIP)

The **Parking Operational Intelligence Platform (POIP)** is a spatial intelligence and decision-support framework built for urban traffic enforcement. It transforms large-scale parking violation logs (298,450 records from Bengaluru) into a prioritized enforcement queue and dynamic zone governance strategies.

Designed for traffic police departments, smart-city planners, and GIS operators, POIP moves away from simple, misleading "violation count" heatmaps. Instead, it computes multidimensional obstruction indices, models congestion spillover across the road network, predicts future hotspot severities, and discovers spatial-behavioral archetypes to recommend targeted interventions.

---

## 🏗️ Workflow Architecture

POIP operates as a sequential analytics pipeline. High-volume, raw logs are processed through spatial, statistical, machine learning, and network layers, producing lightweight data artifacts that power a real-time interactive dashboard.

```
                          [ RAW VIOLATION DATA (CSV) ]
                                       │
                                       ▼
                         [ Cleaning & Temporal Encoding ]
                                       │
                                       ▼
                         [ Spatial Discretisation (H3) ]
                                       │
                                       ▼
                          [ Row-Level POI Calculation ]
                                       │
                                       ▼
                        ┌──────────────┴──────────────┐
                        ▼                             ▼
              [ HDBSCAN Clustering ]        [ Cell aggregation ]
                        │                             │
                        └──────────────┬──────────────┘
                                       │
                                       ▼
                         [ Propagation & Network Spill ]
                                       │
                                       ▼
                         [ Enforcement Failure Index ]
                                       │
                                       ▼
                          [ Congestion Impact Score ]
                                       │
                                       ▼
                           [ Hotspot Lifecycle State ]
                                       │
                                       ▼
                          [ Behavior Archetype KMeans ]
                                       │
                                       ▼
                           [ CatBoost Forecasting ]
                                       │
                                       ▼
                         [ Priority Engine (FPS Score) ]
                                       │
                                       ▼
                       [ Exported JSON/CSV Data Artifacts ]
                                       │
                                       ▼
                         [ React UI & Interactive Maps ]
```

### Key Stages

1. **Spatial Discretisation & Cleaning**: Filters invalid GPS points and divides Bengaluru into H3 resolution-9 hexagonal cells ($\approx 174\text{m}$ edge length).
2. **Parking Obstruction Index (POI)**: A multiplicative severity score calculated per violation. It integrates vehicle footprint (e.g., bus vs. scooter), violation severity (e.g., double parking vs. no-parking zone), junction proximity, and local density.
3. **HDBSCAN Clustering**: Discovers organic, density-variable hotspot clusters across coordinates without administrative boundary assumptions.
4. **Propagation Modelling**: Simulates network spillover to neighboring cells using an inverse-distance weighted nearest-neighbor algorithm.
5. **Enforcement Failure Index (EFI)**: Measures the persistence of chronic violations in the face of local police precinct capacity constraints (burdened stations).
6. **Congestion Impact Score (CIS)**: Aggregates cell-level impact into Low, Medium, High, and Critical operational bands.
7. **Behavioral Archetypes (KMeans)**: Identifies 6 distinct behavioral profiles (e.g., *Junction Choke Points*, *Freight Obstruction Corridors*, *Night Spillovers*) to apply specialized policies.
8. **CatBoost Forecasting**: Regressor predicting the next-hour severity (POI sum) and Classifier predicting high-risk events.
9. **Priority Engine**: Combines all scores into a single **Final Priority Score (FPS)** to establish the daily ranked enforcement queue.

---

## 🕸️ Network Intelligence Layer (Pseudo-GNN)

The **Network Intelligence** module models the city's hotspot ecosystem as a similarity-weighted undirected graph containing 300 key nodes (representing the top spatial cells/hotspots). It employs a **pseudo-GNN (Graph Neural Network) neighborhood aggregation pattern** to represent and target systemic congestion.

### How it works:
1. **Node Definition**: Each node represents a distinct H3 spatial cell hotspot (e.g., Rajajinagar entrance, Anand Rao junction).
2. **Edge Construction (7D Feature Similarity)**: Edges are not drawn purely by geographical adjacency, but by behavioral similarity in a 7-dimensional feature space:
   $$X = \{\mu_{\text{POI}}, \text{CIS}, \text{Propagation Score}, \text{EFI}, \text{Heavy Vehicle Ratio}, \text{Junction Ratio}, \text{Violation Volume}\}$$
   Edges connect cells that are mutually within each other's 5 nearest neighbors in this feature space, with edge weights defined as $W_{ij} = 1 - d_{\text{cosine}}$ (cosine similarity).
3. **Pseudo-GNN Message Passing**:
   - The graph performs **spatial propagation aggregation**: each node's local congestion impact is updated by aggregating severity messages from its topological and geographical neighbors (using the inverse-distance weighted nearest-neighbor spillover).
   - This mimics the message passing layers of a Graph Neural Network (GNN), where a node's final state combines its own features with aggregated neighbor features.
4. **Structural Analysis**:
   - **PageRank Centrality**: Identifies "hub" hotspots that are connected to other highly severe, similar zones. Targeting these hubs yields cascading compliance benefits.
   - **Betweenness Centrality**: Flags "gateway" hotspots that bridge different behavioral clusters. Enforcing these nodes fragments the city's congestion graph.
   - **Community Detection**: Partitions the graph into behavioral communities (e.g., residential overflow clusters vs. industrial corridors) using the Clauset-Newman-Moore modularity maximization algorithm.

### Example Scenario:
Consider **BTP023 - Mahalaxmi Layout Entrance** (Node A) and **BTP083 - AS Char Street** (Node B). 
- Both nodes are highly active junctions showing severe loading behaviors.
- The system draws an edge between Node A and Node B because they share high similarity in their junction ratio, mean POI, and EFI (Enforcement Failure Index).
- Through the **pseudo-GNN neighborhood aggregation**, the propagation score of Node A is updated by receiving neighbor congestion metrics from Node B.
- When an enforcement officer targets Node A (Mahalaxmi Layout), the compliance behavior propagates to Node B, allowing smart-city teams to dispatch resources to structural "hubs" rather than chasing isolated incidents.

---

## 📂 Directory Structure

```
Parking_Operational_Intelligence/
├── backend/                              # FastAPI Python Backend
│   ├── api/
│   │   ├── __init__.py
│   │   └── endpoints.py                  # API endpoints serving KPIs, maps, & forecasts
│   ├── services/
│   │   ├── __init__.py
│   │   └── data_service.py               # Aggregates datasets, models propagation, handles logic
│   ├── Artifacts/                        # Precomputed data exports (CSVs, GeoJSON, HTML)
│   ├── main.py                           # App entry point with CORS & router attachment
│   └── requirements.txt                  # Python dependencies
│
├── frontend/                             # React + TS + Vite + Tailwind Frontend
│   ├── public/                           # Static assets
│   ├── src/
│   │   ├── assets/
│   │   ├── components/                   # Shared UI components (e.g., ClusteredLayer map helper)
│   │   ├── pages/                        # Individual dashboard modules:
│   │   │   ├── ExecutiveCommandCenter.tsx # Main high-level metrics, charts, & priority queue
│   │   │   ├── GISOperationsMap.tsx      # Map interface with cluster visualization
│   │   │   ├── HotspotExplorer.tsx       # Tabular data grid with filters
│   │   │   ├── ForecastCenter.tsx        # CatBoost predictions vs. actual hourly trends
│   │   │   ├── ArchetypeIntelligence.tsx # KMeans cluster profiles and custom interventions
│   │   │   ├── NetworkIntelligence.tsx   # PageRank centralities & community network graph
│   │   │   └── DynamicPolicyEngine.tsx   # Policy simulation dashboard
│   │   ├── App.tsx                       # React routing structure
│   │   ├── Layout.tsx                    # Sidebar layout & navigation
│   │   └── index.css                     # Global styles
│   ├── package.json                      # npm packages
│   └── vite.config.ts                    # Vite config
│
├── Notebook/                             # Analysis & ML Training
│   └── flipkart-gridlock-r2-theme-1-solution.ipynb  # Primary development notebook
│
├── Report/                               # Documentation
│   ├── Parking_Operational_Intelligence_Report.pdf  # Detailed technical report (PDF)
│   └── Parking_Operational_Intelligence_Report.tex  # LaTeX sources
│
├── test_backend.py                       # Lightweight integration script for backend services
└── README.md                             # This file
```

---

## 🚀 Getting Started

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```
   *The API will be available at `http://127.0.0.1:8000`.*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*

---

## 🌐 Deployment Instructions

### Deploying Backend (FastAPI) to Render

Render is an excellent platform for deploying the FastAPI backend:

1. **Create a Render Account**: Sign up at [render.com](https://render.com/).
2. **New Web Service**: Click **New +** and select **Web Service**.
3. **Connect Repository**: Connect your GitHub repository containing this project.
4. **Configure Settings**:
   - **Name**: Choose a name (e.g., `parking-operational-intelligence-backend`).
   - **Environment**: Select `Python` (or `Docker` if you package it, but Python is standard).
   - **Root Directory**: Set this to `backend`. This ensures Render runs inside the `backend` folder where `requirements.txt` and `main.py` live.
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Deploy**: Click **Create Web Service**. Render will build the environment and host your FastAPI API.
   *Copy your live backend URL (e.g., `https://parking-operational-intelligence-backend.onrender.com`).*

### Deploying Frontend (React/Vite) to Vercel

Vercel is the recommended platform for hosting the React frontend:

1. **Create a Vercel Account**: Sign up at [vercel.com](https://vercel.com/).
2. **Import Project**: Select **Add New...** -> **Project** and import your GitHub repository.
3. **Configure Settings**:
   - **Framework Preset**: Select `Vite`.
   - **Root Directory**: Click Edit next to Root Directory, select the `frontend` folder, and click **Continue**.
   - **Build and Development Settings**: Default settings (`npm run build`, `dist`, `npm install`) are correct.
4. **Environment Variables**:
   - Expand the **Environment Variables** section.
   - Add a new variable:
     - **Key**: `VITE_API_BASE_URL`
     - **Value**: The live backend URL you copied from Render (e.g., `https://parking-operational-intelligence-backend.onrender.com`).
5. **Deploy**: Click **Deploy**. Vercel will build the frontend and provide a public deployment URL.
