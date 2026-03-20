import { useState } from 'react';
import Dashboard from './components/Dashboard';
import DriversManager from './components/DriversManager';
import Summary from './components/Summary';
import { LayoutDashboard, Users, ClipboardList } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span className="bg-[#0c6839] px-2 py-1 rounded">T!</span> Traigo
          </h1>
          <nav className="flex gap-2 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              <LayoutDashboard size={18} /> Operación
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                activeTab === 'drivers' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              <Users size={18} /> Domiciliarios
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                activeTab === 'summary' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              <ClipboardList size={18} /> Caja
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'drivers' && <DriversManager />}
        {activeTab === 'summary' && <Summary />}
      </main>
    </div>
  );
}