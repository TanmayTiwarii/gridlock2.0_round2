
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Map, FileSearch, LineChart, Cpu, Search, Network, Shield } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/', label: 'Executive Command Center', icon: Home },
  { path: '/search', label: 'Semantic Search', icon: Search },
  { path: '/map', label: 'GIS Operations Map', icon: Map },
  { path: '/explorer', label: 'Hotspot Explorer', icon: FileSearch },
  { path: '/forecast', label: 'Forecast Center', icon: LineChart },
  { path: '/archetypes', label: 'Archetype Intelligence', icon: Cpu },
  { path: '/network', label: 'Network Intelligence', icon: Network },
  { path: '/policy', label: 'Dynamic Policy Engine', icon: Shield },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6">
          <h1 className="text-xl font-bold leading-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Parking Intelligence
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-900/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8 relative">
        <Outlet />
      </main>
    </div>
  );
}
