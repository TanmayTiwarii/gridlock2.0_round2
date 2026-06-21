import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPage, setJumpPage] = useState('');
  const itemsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, archetypeFilter, trendFilter]);

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

  const totalPages = Math.ceil(filteredHotspots.length / itemsPerPage);
  const currentItems = filteredHotspots.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpPage, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setJumpPage('');
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
      pages.push(i);
    }
    return pages;
  };

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
              {currentItems.map((h, i) => (
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
          {totalPages > 1 && (
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border-t border-slate-200">
              <span className="text-sm text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredHotspots.length)} of {filteredHotspots.length} entries
              </span>
              <div className="flex gap-2 items-center">
                <form onSubmit={handleJumpPage} className="flex items-center gap-2 mr-4">
                  <span className="text-sm text-slate-500">Go to:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)}
                    placeholder="Page"
                    className="w-16 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button type="submit" className="hidden">Go</button>
                </form>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex gap-1 mx-1">
                  {getPageNumbers().map((p, idx) => (
                    p >= 1 && p <= totalPages ? (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          currentPage === p 
                            ? 'bg-indigo-600 text-white border border-indigo-600 shadow-sm' 
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    ) : (
                      <div key={`empty-${idx}`} className="w-8 h-8" />
                    )
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-opacity"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
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
