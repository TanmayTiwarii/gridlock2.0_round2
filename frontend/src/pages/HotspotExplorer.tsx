import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Filter } from 'lucide-react';

interface Hotspot {
  spatial_cell: string;
  display_label?: string;
  archetype_name: string;
  lifecycle_state: string;
  mean_poi: number;
  cis: number;
  final_priority_score: number;
  forecast_next_poi: number;
  hotspot_text: string;
}

export default function HotspotExplorer() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState('');
  const [trendFilter, setTrendFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/hotspots');
        setHotspots(res.data);
      } catch (err) {
        console.error("Failed to load hotspots", err);
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

  const archetypes = Array.from(new Set(hotspots.map(h => h.archetype_name)));
  const trends = Array.from(new Set(hotspots.map(h => h.lifecycle_state)));

  const filteredHotspots = hotspots.filter(h => {
    const label = h.display_label || h.spatial_cell;
    const matchesSearch = label.toLowerCase().includes(search.toLowerCase());
    const matchesArch = archetypeFilter ? h.archetype_name === archetypeFilter : true;
    const matchesTrend = trendFilter ? h.lifecycle_state === trendFilter : true;
    return matchesSearch && matchesArch && matchesTrend;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <h2 className="text-3xl font-bold text-slate-800">Hotspot Explorer</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Location..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="w-full md:w-64 relative">
            <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <select 
              value={archetypeFilter}
              onChange={e => setArchetypeFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="">All Archetypes</option>
              {archetypes.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="w-full md:w-64 relative">
            <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <select 
              value={trendFilter}
              onChange={e => setTrendFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="">All Trends</option>
              {trends.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm whitespace-nowrap text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Archetype</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">POI</th>
                <th className="px-6 py-4">CIS</th>
                <th className="px-6 py-4">Trend</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredHotspots.slice(0, 50).map((h, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900">{h.display_label || h.spatial_cell}</td>
                  <td className="px-6 py-3">
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      {h.archetype_name}
                    </span>
                  </td>
                  <td className="px-6 py-3">{h.final_priority_score?.toFixed(2)}</td>
                  <td className="px-6 py-3">{h.mean_poi?.toFixed(2)}</td>
                  <td className="px-6 py-3">{h.cis?.toFixed(2)}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      h.lifecycle_state === 'Stable' ? 'bg-emerald-50 text-emerald-700' :
                      h.lifecycle_state === 'Emerging' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {h.lifecycle_state}
                    </span>
                  </td>
                  <td className="px-6 py-3 max-w-xs truncate" title={h.hotspot_text?.split('Recommended Action: ')[1] || 'Monitor'}>
                    {h.hotspot_text?.split('Recommended Action: ')[1] || 'Monitor'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredHotspots.length > 50 && (
            <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 border-t border-slate-200">
              Showing top 50 of {filteredHotspots.length} results. Please use filters to narrow down.
            </div>
          )}
          {filteredHotspots.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No hotspots found matching your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
