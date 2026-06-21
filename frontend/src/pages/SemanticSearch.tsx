import { useState } from 'react';
import axios from 'axios';
import { Search, Sparkles, ChevronRight } from 'lucide-react';

interface SearchResult {
  spatial_cell: string;
  display_label?: string;
  archetype_name: string;
  lifecycle_state: string;
  hotspot_text: string;
  final_priority_score: number;
  pred_high_risk_prob: number;
  similarity_score: number;
}

const EXAMPLES = [
  "Show chronic scooter violations",
  "Busy junction hotspots",
  "Tow ready locations",
  "High spillover commercial areas"
];

export default function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const q = presetQuery || query;
    if (!q.trim()) return;

    setQuery(q);
    setLoading(true);
    setSearched(true);
    
    try {
      const res = await axios.get('/api/search', { params: { query: q, top_k: 10 } });
      setResults(res.data.results);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
      
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-full mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-bold text-slate-800 mb-4">Semantic Hotspot Search</h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Use natural language to find specific types of parking violations, specific archetypes, or complex behaviors using our vector embeddings.
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-6 h-6 text-slate-400" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 'Show me commercial areas with high night spillovers...'"
            className="w-full pl-14 pr-32 py-5 text-lg border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
          />
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            className="absolute right-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {!searched && (
        <div className="max-w-3xl mx-auto mt-8">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Try asking about</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXAMPLES.map((ex, i) => (
              <button 
                key={i} 
                onClick={() => handleSearch(undefined, ex)}
                className="text-left p-4 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-xl transition-all flex items-center justify-between group"
              >
                <span className="text-slate-700 font-medium">{ex}</span>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {searched && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-bold text-slate-800">Results</h3>
          
          {loading ? (
             <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
             </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((res, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-6 hover:border-indigo-300 transition-colors">
                  
                  {/* Left Column: Match Info */}
                  <div className="flex-shrink-0 sm:w-48 flex flex-col justify-center items-center p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <span className="text-3xl font-bold text-indigo-700">{(res.similarity_score * 100).toFixed(1)}%</span>
                    <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mt-1">Match Score</span>
                  </div>

                  {/* Right Column: Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-lg font-bold text-slate-800">{res.display_label || res.spatial_cell}</h4>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                          {res.archetype_name}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${res.final_priority_score > 80 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          Priority: {res.final_priority_score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                      {res.hotspot_text}
                    </p>
                    <div className="flex gap-4 pt-2">
                      <div className="text-sm">
                        <span className="text-slate-500">Trend: </span>
                        <span className="font-medium text-slate-700">{res.lifecycle_state}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">Forecast Risk: </span>
                        <span className="font-medium text-slate-700">{(res.pred_high_risk_prob * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
              <p className="text-slate-500">No results found for your query.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
