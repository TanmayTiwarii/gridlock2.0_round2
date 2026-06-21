import { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ClusteredLayer } from '../components/ClusteredLayer';

export default function GISOperationsMap() {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/geojson');
        setGeoData(res.data);
      } catch (err) {
        console.error("Failed to load geojson", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Coloring functions
  const getPriorityColor = (d: number) => {
    return d > 80 ? '#ef4444' : d > 50 ? '#eab308' : '#22c55e';
  };

  const getCisColor = (d: number) => {
    return d > 80 ? '#7e22ce' : d > 50 ? '#a855f7' : '#d8b4fe';
  };

  const archetypeColors: Record<string, string> = {
    'Junction Choke Points': '#f97316',
    'Commercial Arteries': '#3b82f6',
    'Night Spillovers': '#8b5cf6',
    'Transit Hubs': '#14b8a6',
    'Residential Spillovers': '#ec4899',
    'Event Venues': '#eab308'
  };

  const getArchetypeColor = (arch: string) => {
    return archetypeColors[arch] || '#6b7280';
  };

  // Style functions for each layer
  const priorityStyle = (feature: any) => ({
    fillColor: getPriorityColor(feature.properties.final_priority_score || feature.properties.priority),
    weight: 1,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  });

  const cisStyle = (feature: any) => ({
    fillColor: getCisColor(feature.properties.cis),
    weight: 1,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  });

  const archetypeStyle = (feature: any) => ({
    fillColor: getArchetypeColor(feature.properties.archetype_name || feature.properties.archetype),
    weight: 1,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  });

  const forecastStyle = (feature: any) => ({
    fillColor: feature.properties.pred_high_risk_prob > 0.5 ? '#dc2626' : '#fca5a5',
    weight: 1,
    opacity: 1,
    color: 'white',
    fillOpacity: Math.max(0.2, feature.properties.pred_high_risk_prob || 0)
  });

  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties;
    layer.bindPopup(`
      <div class="p-1">
        <strong class="text-sm block mb-1">Location: ${props.display_label || props.spatial_cell}</strong>
        <p class="text-xs mb-1"><b>Archetype:</b> ${props.archetype_name || props.archetype}</p>
        <p class="text-xs mb-1"><b>Priority:</b> ${(props.final_priority_score || props.priority)?.toFixed(2)}</p>
        <p class="text-xs mb-1"><b>POI:</b> ${(props.mean_poi || 0)?.toFixed(2)}</p>
        <p class="text-xs mb-1"><b>CIS:</b> ${(props.cis || 0)?.toFixed(2)}</p>
        <p class="text-xs mb-1"><b>Forecast Risk:</b> ${((props.pred_high_risk_prob || 0) * 100).toFixed(1)}%</p>
        <p class="text-xs mb-1"><b>Trend:</b> ${props.lifecycle_state || props.lifecycle}</p>
        <p class="text-xs mt-2 text-indigo-600 font-medium"><b>Action:</b> ${props.hotspot_text?.split('Recommended Action: ')[1] || 'Monitor'}</p>
      </div>
    `);
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500 pb-10">
      <h2 className="text-3xl font-bold text-slate-800">GIS Operations Map</h2>
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative z-0" style={{ minHeight: '600px' }}>
        {geoData && (
          <MapContainer preferCanvas={true} center={[12.9716, 77.5946]} zoom={11} style={{ height: '100%', width: '100%' }}>
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Priority Layer">
                <ClusteredLayer geoData={geoData} styleFn={priorityStyle} onEachFeature={onEachFeature} />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="CIS Layer">
                <ClusteredLayer geoData={geoData} styleFn={cisStyle} onEachFeature={onEachFeature} />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Archetype Layer">
                <ClusteredLayer geoData={geoData} styleFn={archetypeStyle} onEachFeature={onEachFeature} />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Forecast Layer (Risk)">
                <ClusteredLayer geoData={geoData} styleFn={forecastStyle} onEachFeature={onEachFeature} />
              </LayersControl.BaseLayer>
            </LayersControl>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </MapContainer>
        )}
      </div>
    </div>
  );
}
