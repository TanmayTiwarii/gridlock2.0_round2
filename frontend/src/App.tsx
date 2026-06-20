
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import ExecutiveCommandCenter from './pages/ExecutiveCommandCenter';
import GISOperationsMap from './pages/GISOperationsMap';
import HotspotExplorer from './pages/HotspotExplorer';
import ForecastCenter from './pages/ForecastCenter';
import ArchetypeIntelligence from './pages/ArchetypeIntelligence';
import SemanticSearch from './pages/SemanticSearch';
import NetworkIntelligence from './pages/NetworkIntelligence';
import DynamicPolicyEngine from './pages/DynamicPolicyEngine';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ExecutiveCommandCenter />} />
          <Route path="map" element={<GISOperationsMap />} />
          <Route path="explorer" element={<HotspotExplorer />} />
          <Route path="forecast" element={<ForecastCenter />} />
          <Route path="archetypes" element={<ArchetypeIntelligence />} />
          <Route path="search" element={<SemanticSearch />} />
          <Route path="network" element={<NetworkIntelligence />} />
          <Route path="policy" element={<DynamicPolicyEngine />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
