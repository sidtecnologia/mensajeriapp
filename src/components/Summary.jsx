import { useState, useEffect } from 'react';
import { centralDb } from '../lib/supabase';
import { LayoutDashboard, Users, Store, Wallet, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';

export default function Summary() {
  const [report, setReport] = useState({ byBiz: [], byDriver: [], totalServices: 0 });
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const DELIVERY_COST = 4000;

  const fetchSummaryData = async () => {
    const { data, error } = await centralDb
      .from('deliveries')
      .select('*, drivers(name)')
      .eq('status', 'Entregado')
      .gte('completed_at', `${dateFilter}T00:00:00`)
      .lte('completed_at', `${dateFilter}T23:59:59`);

    if (data) {
      // Agrupar por Negocio
      const bizMap = data.reduce((acc, item) => {
        acc[item.business_name] = (acc[item.business_name] || 0) + 1;
        return acc;
      }, {});

      // Agrupar por Domiciliario
      const driverMap = data.reduce((acc, item) => {
        const name = item.drivers?.name || 'Desconocido';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      setReport({
        byBiz: Object.entries(bizMap).map(([name, count]) => ({ name, count, total: count * DELIVERY_COST })),
        byDriver: Object.entries(driverMap).map(([name, count]) => ({ name, count, total: count * DELIVERY_COST })),
        totalServices: data.length
      });
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [dateFilter]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header y Filtro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Resumen de Caja</h1>
          <p className="text-gray-500 text-sm font-medium">Liquidación basada en tarifa fija de $4,000 por servicio</p>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border">
          <CalendarIcon className="text-gray-400" size={20} />
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-transparent font-bold text-gray-700 outline-none"
          />
        </div>
      </div>

      {/* Cards de Totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
          <div className="flex items-center gap-3 opacity-80 mb-2">
            <CheckCircle size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Servicios Totales</span>
          </div>
          <p className="text-4xl font-black">{report.totalServices}</p>
        </div>
        
        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
          <div className="flex items-center gap-3 opacity-80 mb-2">
            <Wallet size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Total a Recaudar</span>
          </div>
          <p className="text-4xl font-black">${(report.totalServices * DELIVERY_COST).toLocaleString()}</p>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <Store size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Negocios Atendidos</span>
          </div>
          <p className="text-4xl font-black text-gray-800">{report.byBiz.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla por Negocios */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <Store size={18} className="text-gray-400" />
            <h2 className="font-black text-gray-700 uppercase text-sm tracking-widest">Información Negocios</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
              <tr>
                <th className="p-4 text-left">Establecimiento</th>
                <th className="p-4 text-center">Cant.</th>
                <th className="p-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.byBiz.map((biz, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{biz.name}</td>
                  <td className="p-4 text-center">
                    <span className="bg-gray-100 px-2 py-1 rounded-lg text-xs font-bold">{biz.count}</span>
                  </td>
                  <td className="p-4 text-right font-black text-blue-600">${biz.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabla por Domiciliarios */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <Users size={18} className="text-gray-400" />
            <h2 className="font-black text-gray-700 uppercase text-sm tracking-widest">Información Domiciliarios</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
              <tr>
                <th className="p-4 text-left">Conductor</th>
                <th className="p-4 text-center">Servicios</th>
                <th className="p-4 text-right">Total Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.byDriver.map((driver, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{driver.name}</td>
                  <td className="p-4 text-center">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">{driver.count}</span>
                  </td>
                  <td className="p-4 text-right font-black text-green-700">${driver.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {report.totalServices === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold text-lg">No hay servicios registrados para esta fecha</p>
          <p className="text-gray-300 text-sm">Cambia la fecha en el calendario para ver reportes anteriores</p>
        </div>
      )}
    </div>
  );
}