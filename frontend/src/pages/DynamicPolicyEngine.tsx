import { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface Hotspot {
  spatial_cell: string;
  cis: number;
}

const POLICIES = [
  {
    zone: 'Zone A',
    condition: 'CIS < 25',
    maxCIS: 25,
    minCIS: 0,
    policy: '120 min parking',
    fee: 'Base fee',
    enforcement: 'Low enforcement',
    icon: Info,
    color: 'bg-emerald-100 text-emerald-700',
    borderColor: 'border-emerald-200'
  },
  {
    zone: 'Zone B',
    condition: 'CIS 25 - 50',
    maxCIS: 50,
    minCIS: 25,
    policy: '60 min parking',
    fee: '1.5x fee',
    enforcement: 'Warning enforcement',
    icon: AlertCircle,
    color: 'bg-yellow-100 text-yellow-700',
    borderColor: 'border-yellow-200'
  },
  {
    zone: 'Zone C',
    condition: 'CIS 50 - 75',
    maxCIS: 75,
    minCIS: 50,
    policy: '30 min parking',
    fee: '2x fee',
    enforcement: 'Frequent patrols',
    icon: AlertTriangle,
    color: 'bg-orange-100 text-orange-700',
    borderColor: 'border-orange-200'
  },
  {
    zone: 'Zone D',
    condition: 'CIS 75+',
    maxCIS: 999,
    minCIS: 75,
    policy: 'Tow-ready',
    fee: 'Dynamic premium fee',
    enforcement: 'Immediate intervention',
    icon: ShieldAlert,
    color: 'bg-red-100 text-red-700',
    borderColor: 'border-red-200'
  }
];

export default function DynamicPolicyEngine() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getZoneCount = (min: number, max: number) => {
    return hotspots.filter(h => h.cis >= min && h.cis < max).length;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-6xl mx-auto">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Dynamic Policy Engine</h2>
          <p className="text-slate-500 mt-2 text-lg">Automated regulatory response framework based on real-time Congestion Impact Scores.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold border border-indigo-100">
          Engine Status: Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {POLICIES.map((p, i) => {
          const activeCells = getZoneCount(p.minCIS, p.maxCIS);
          
          return (
            <div key={i} className={`bg-white rounded-xl shadow-sm border ${p.borderColor} overflow-hidden hover:shadow-md transition-shadow`}>
              <div className={`${p.color} p-4 flex items-center justify-between`}>
                <div>
                  <h3 className="font-bold text-lg">{p.zone}</h3>
                  <p className="text-sm opacity-90">{p.condition}</p>
                </div>
                <p.icon className="w-8 h-8 opacity-75" />
              </div>
              
              <div className="p-6 space-y-4">
                
                <div className="text-center py-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-3xl font-black text-slate-800">{activeCells}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Active Cells in Zone</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Max Duration</p>
                    <p className="font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-100">{p.policy}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pricing Tier</p>
                    <p className="font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-100">{p.fee}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Enforcement Posture</p>
                    <p className="font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-100">{p.enforcement}</p>
                  </div>
                </div>

              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <button className={`w-full py-2 rounded-lg font-medium transition-colors border ${
                  p.zone === 'Zone D' ? 'bg-red-600 text-white hover:bg-red-700 border-red-600' : 
                  'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                }`}>
                  {p.zone === 'Zone D' ? 'Dispatch Tow Units' : 'Edit Policy Rules'}
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
