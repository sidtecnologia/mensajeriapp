import { useState, useEffect } from 'react';
import { centralDb } from '../lib/supabase';
import { UserPlus, Trash2, Edit2, X, Save, Power, PowerOff } from 'lucide-react';

export default function DriversManager() {
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', vehicle: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchDrivers = async () => {
    const { data } = await centralDb
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setDrivers(data);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Disponible' ? 'No Disponible' : 'Disponible';
    
    const { error } = await centralDb
      .from('drivers')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setDrivers(drivers.map(d => d.id === id ? { ...d, status: newStatus } : d));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingId) {
      await centralDb
        .from('drivers')
        .update(form)
        .eq('id', editingId);
      setEditingId(null);
    } else {
      await centralDb
        .from('drivers')
        .insert([{ ...form, status: 'Disponible' }]);
    }
    
    setForm({ name: '', phone: '', vehicle: '' });
    fetchDrivers();
  };

  const startEdit = (driver) => {
    setEditingId(driver.id);
    setForm({
      name: driver.name,
      phone: driver.phone,
      vehicle: driver.vehicle
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', phone: '', vehicle: '' });
  };

  const deleteDriver = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este domiciliario?')) {
      await centralDb.from('drivers').delete().eq('id', id);
      fetchDrivers();
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className={`rounded-xl shadow-lg border-2 transition-all p-6 mb-8 ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent'}`}>
        <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-gray-800">
          {editingId ? (
            <><Edit2 className="text-blue-600" /> Editando Domiciliario</>
          ) : (
            <><UserPlus className="text-green-600" /> Registro de Domiciliarios</>
          )}
        </h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nombre</label>
            <input 
              type="text" placeholder="Ej: Juan Pérez" required
              className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-blue-500 bg-white font-medium"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">WhatsApp (con código)</label>
            <input 
              type="text" placeholder="Ej: 57310..." required
              className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-blue-500 bg-white font-medium"
              value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Vehículo y Placa</label>
            <input 
              type="text" placeholder="Ej: Moto ABC-123" required
              className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-blue-500 bg-white font-medium"
              value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})}
            />
          </div>
          
          <div className="flex items-end gap-2">
            <button 
              type="submit" 
              className={`flex-1 h-[52px] rounded-xl font-black text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-black'
              }`}
            >
              {editingId ? <><Save size={18}/> Actualizar</> : 'Registrar'}
            </button>
            {editingId && (
              <button 
                type="button"
                onClick={cancelEdit}
                className="h-[52px] w-[52px] bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-xl flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Domiciliario</th>
              <th className="p-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">WhatsApp</th>
              <th className="p-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Vehículo</th>
              <th className="p-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Estado Operativo</th>
              <th className="p-4 text-[11px] font-black text-gray-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {drivers.map(driver => (
              <tr key={driver.id} className={`hover:bg-gray-50/50 transition-colors ${editingId === driver.id ? 'bg-blue-50/30' : ''}`}>
                <td className="p-4">
                  <p className="font-bold text-gray-900">{driver.name}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm font-medium text-blue-600">+{driver.phone}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm text-gray-600">{driver.vehicle}</p>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleStatus(driver.id, driver.status)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all active:scale-95 border-2 ${
                      driver.status === 'Disponible' 
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    {driver.status === 'Disponible' ? <Power size={14} /> : <PowerOff size={14} />}
                    {driver.status}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-1">
                    <button 
                      onClick={() => startEdit(driver)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar registro"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => deleteDriver(driver.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar domiciliario"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {drivers.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 font-medium">No hay domiciliarios registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}