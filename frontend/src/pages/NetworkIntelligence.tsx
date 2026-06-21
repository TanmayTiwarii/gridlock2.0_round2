import { useEffect, useState } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';

interface GraphNode {
  spatial_cell: string;
  display_label?: string;
  archetype_name: string;
  cis: number;
  pagerank: number;
  community_id: number;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export default function NetworkIntelligence() {
  const [data, setData] = useState<{ nodes: GraphNode[], edges: GraphEdge[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/network');
        setData(res.data);
      } catch (err) {
        console.error("Failed to load network data", err);
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

  // Sample nodes to avoid browser crash (ECharts can handle ~1000 nodes well, but FAISS k=5 over 7800 means ~30000 edges)
  // Let's filter to top 500 nodes by PageRank
  const topNodes = [...data.nodes].sort((a, b) => b.pagerank - a.pagerank).slice(0, 300);
  const topNodeIds = new Set(topNodes.map(n => n.spatial_cell));
  
  const validEdges = data.edges.filter(e => topNodeIds.has(e.source) && topNodeIds.has(e.target));

  const archetypeColors: Record<string, string> = {
    'Junction Choke Points': '#f97316',
    'Commercial Arteries': '#3b82f6',
    'Night Spillovers': '#8b5cf6',
    'Transit Hubs': '#14b8a6',
    'Residential Spillovers': '#ec4899',
    'Event Venues': '#eab308'
  };

  const categories = Object.keys(archetypeColors).map(name => ({ name }));

  const chartOption = {
    tooltip: {},
    legend: [{
      data: categories.map(a => a.name),
      orient: 'vertical',
      right: 10,
      top: 20
    }],
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: topNodes.map(n => ({
          id: n.spatial_cell,
          name: n.display_label || n.spatial_cell,
          symbolSize: Math.max(5, (n.cis / 100) * 20),
          category: n.archetype_name,
          itemStyle: {
            color: archetypeColors[n.archetype_name] || '#6b7280'
          },
          value: n.cis
        })),
        edges: validEdges.map(e => ({
          source: e.source,
          target: e.target,
          lineStyle: {
            width: e.weight * 3,
            curveness: 0.1,
            opacity: 0.5
          }
        })),
        categories: categories,
        roam: true,
        label: {
          show: false,
          position: 'right',
          formatter: '{b}'
        },
        force: {
          repulsion: 200,
          gravity: 0.1,
          edgeLength: 50
        },
        lineStyle: {
          color: 'source',
          curveness: 0.3
        }
      }
    ]
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500 pb-10">
      <h2 className="text-3xl font-bold text-slate-800">Network Intelligence</h2>
      
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative" style={{ minHeight: '600px' }}>
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow border border-slate-100 max-w-sm">
          <h4 className="font-bold text-slate-800 mb-2">Network Insights</h4>
          <ul className="text-sm text-slate-600 space-y-2">
            <li><strong>Nodes:</strong> Top 300 highly connected cells (filtered for performance).</li>
            <li><strong>Node Size:</strong> Congestion Impact Score (CIS).</li>
            <li><strong>Node Color:</strong> Archetype classification.</li>
            <li><strong>Edge Thickness:</strong> Semantic and spatial similarity.</li>
          </ul>
        </div>
        
        <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
}
