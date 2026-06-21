import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

interface ForecastData {
  spatial_cell: string;
  display_label?: string;
  actual_poi: number;
  predicted_poi: number;
  absolute_error: number;
  pred_high_risk_prob: number;
  datetime_key: string;
  archetype_name: string;
}

export default function ForecastCenter() {
  const [data, setData] = useState<{ predictions: ForecastData[], timeseries: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/forecast');
        setData(res.data);
      } catch (err) {
        console.error("Failed to load forecast data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Sample data to avoid rendering thousands of points in scatter
  const scatterData = data.predictions.filter((_, i) => i % 5 === 0).map(d => ({
    x: d.actual_poi,
    y: d.predicted_poi,
    z: 1 // size
  }));

  // Histogram data for Error (using bins)
  const bins = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 5.0];
  const errorCounts = new Array(bins.length - 1).fill(0);
  
  data.predictions.forEach(d => {
    const err = d.absolute_error;
    for (let i = 0; i < bins.length - 1; i++) {
      if (err >= bins[i] && err < bins[i+1]) {
        errorCounts[i]++;
        break;
      }
    }
  });

  const histogramData = errorCounts.map((count, i) => ({
    name: `${bins[i]}-${bins[i+1]}`,
    count
  }));

  // High Risk Forecasts
  const highRisk = [...data.predictions]
    .filter(d => d.pred_high_risk_prob > 0.5)
    .sort((a, b) => b.predicted_poi - a.predicted_poi)
    .slice(0, 50);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <h2 className="text-3xl font-bold text-slate-800">Forecast Center</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Scatter Plot */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Actual vs Forecast (Sampled)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Actual POI" unit="" />
                <YAxis type="number" dataKey="y" name="Predicted POI" unit="" />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="POI" data={scatterData} fill="#6366f1" opacity={0.5} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Histogram */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Forecast Error Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* High Risk Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">High Risk Forecasts</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm whitespace-nowrap text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Datetime</th>
                <th className="px-6 py-4">Archetype</th>
                <th className="px-6 py-4">Predicted POI</th>
                <th className="px-6 py-4">Risk Prob</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {highRisk.map((h, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900">{h.display_label || h.spatial_cell}</td>
                  <td className="px-6 py-3">{h.datetime_key}</td>
                  <td className="px-6 py-3">{h.archetype_name}</td>
                  <td className="px-6 py-3 text-red-600 font-bold">{h.predicted_poi.toFixed(2)}</td>
                  <td className="px-6 py-3">{(h.pred_high_risk_prob * 100).toFixed(1)}%</td>
                </tr>
              ))}
              {highRisk.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No high-risk forecasts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
