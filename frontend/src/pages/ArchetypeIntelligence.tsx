import { useEffect, useState } from 'react';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ClusteredLayer } from '../components/ClusteredLayer';

interface Archetype {
  archetype_name: string;
  cells: number;
  mean_poi: number;
  mean_cis: number;
  mean_priority: number;
  mean_propagation: number;
  mean_failure: number;
}

export default function ArchetypeIntelligence() {
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [archRes, geoRes] = await Promise.all([
          axios.get('/api/archetypes'),
          axios.get('/api/geojson')
        ]);
        setArchetypes(archRes.data);
        setGeoData(geoRes.data);
      } catch (err) {
        console.error("Failed to load archetypes", err);
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

  // Define policy recommendations based on Archetype Name
  const getPolicy = (name: string) => {
    if (name.includes('Spillover')) return 'Dynamic perimeter pricing + evening patrols.';
    if (name.includes('Choke Points')) return 'Zero tolerance towing + automated enforcement.';
    if (name.includes('Commercial')) return 'Progressive pricing structure (1.5x after 60 min).';
    if (name.includes('Transit')) return 'Dedicated drop-off zones + strict max-wait times.';
    return 'Regular monitoring + standard enforcement.';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <h2 className="text-3xl font-bold text-slate-800">Archetype Intelligence</h2>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {archetypes.map((arch, i) => {
          
          // Data for Radar Chart. We normalize them to 0-100 roughly for visual parity, 
          // but since recharts can auto-scale if we don't fix the domain, we just pass raw values.
          const radarData = [
            { subject: 'Avg POI (x10)', A: arch.mean_poi * 10, fullMark: 100 },
            { subject: 'CIS', A: arch.mean_cis, fullMark: 100 },
            { subject: 'Priority', A: arch.mean_priority, fullMark: 100 },
            { subject: 'Spillover', A: arch.mean_propagation, fullMark: 100 },
            { subject: 'Repeat Rate', A: arch.mean_failure, fullMark: 100 },
          ];

          // Filter geojson for this archetype only
          const filteredGeo = {
            ...geoData,
            features: geoData?.features.filter((f: any) => (f.properties.archetype_name || f.properties.archetype) === arch.archetype_name)
          };

          return (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="bg-slate-900 text-white p-5">
                <h3 className="text-xl font-bold">{arch.archetype_name}</h3>
                <p className="text-slate-400 text-sm mt-1">{arch.cells} active cells</p>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                {/* Metrics */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Avg CIS</p>
                    <p className="text-2xl font-bold text-slate-800">{arch.mean_cis.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Avg POI</p>
                    <p className="text-2xl font-bold text-slate-800">{arch.mean_poi.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Risk Level</p>
                    <p className="text-xl font-semibold text-red-500">
                      {arch.mean_priority > 80 ? 'Critical' : arch.mean_priority > 60 ? 'High' : 'Medium'}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-indigo-500 uppercase font-bold tracking-wider mb-2">Policy Recommendation</p>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {getPolicy(arch.archetype_name)}
                    </p>
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="h-64 md:h-auto min-h-[250px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name={arch.archetype_name} dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mini Map */}
              <div className="h-48 bg-slate-100 border-t border-slate-200">
                {filteredGeo && filteredGeo.features.length > 0 && (
                  <MapContainer preferCanvas={true} center={[12.9716, 77.5946]} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <ClusteredLayer 
                      geoData={filteredGeo} 
                      styleFn={() => ({ fillColor: '#8b5cf6', weight: 0, fillOpacity: 0.8 })}
                    />
                  </MapContainer>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
