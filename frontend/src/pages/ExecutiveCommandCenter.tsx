import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { AlertTriangle, MapPin, TrendingUp, AlertCircle, BarChart3, Activity } from 'lucide-react';

interface Hotspot {
  spatial_cell: string;
  archetype_name: string;
  lifecycle_state: string;
  mean_poi: number;
  cis: number;
  final_priority_score: number;
  pred_high_risk_prob: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

export default function ExecutiveCommandCenter() {
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

  // Calculate KPIs
  const totalHotspots = hotspots.length;
  const criticalHotspots = hotspots.filter(h => h.final_priority_score > 80).length;
  const avgPOI = (hotspots.reduce((acc, h) => acc + h.mean_poi, 0) / totalHotspots).toFixed(2);
  const avgCIS = (hotspots.reduce((acc, h) => acc + h.cis, 0) / totalHotspots).toFixed(2);
  const forecastedRiskZones = hotspots.filter(h => h.pred_high_risk_prob > 0.1).length;
  // For total violations, we approximate based on POI or just use placeholder if not available.
  const totalViolations = (hotspots.reduce((acc, h) => acc + h.mean_poi, 0) * 30).toFixed(0); 

  // Priority Distribution Data
  const priorityBands = {
    'Critical (>80)': 0,
    'High (60-80)': 0,
    'Medium (40-60)': 0,
    'Low (<40)': 0,
  };
  hotspots.forEach(h => {
    if (h.final_priority_score > 80) priorityBands['Critical (>80)']++;
    else if (h.final_priority_score > 60) priorityBands['High (60-80)']++;
    else if (h.final_priority_score > 40) priorityBands['Medium (40-60)']++;
    else priorityBands['Low (<40)']++;
  });
  const priorityData = Object.entries(priorityBands).map(([name, count]) => ({ name, count }));

  // Archetype Distribution Data
  const archetypeCounts: Record<string, number> = {};
  hotspots.forEach(h => {
    archetypeCounts[h.archetype_name] = (archetypeCounts[h.archetype_name] || 0) + 1;
  });
  const archetypeData = Object.entries(archetypeCounts).map(([name, value]) => ({ name, value }));

  // Trend Distribution Data
  const trendCounts: Record<string, number> = {};
  hotspots.forEach(h => {
    trendCounts[h.lifecycle_state] = (trendCounts[h.lifecycle_state] || 0) + 1;
  });
  const trendData = Object.entries(trendCounts).map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <h2 className="text-3xl font-bold text-slate-800">Executive Command Center</h2>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Total Violations (est)" value={totalViolations} icon={AlertTriangle} color="text-orange-500" />
        <KPICard title="Total Hotspots" value={totalHotspots} icon={MapPin} color="text-indigo-500" />
        <KPICard title="Critical Hotspots" value={criticalHotspots} icon={AlertCircle} color="text-red-500" />
        <KPICard title="Risk Zones (Forecast)" value={forecastedRiskZones} icon={TrendingUp} color="text-purple-500" />
        <KPICard title="Avg POI" value={avgPOI} icon={BarChart3} color="text-blue-500" />
        <KPICard title="Avg CIS" value={avgCIS} icon={Activity} color="text-emerald-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Priority Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Priority Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Archetype Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Archetype Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={archetypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {archetypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '11px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Lifecycle Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
      <div className={`p-3 rounded-lg bg-slate-50 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
