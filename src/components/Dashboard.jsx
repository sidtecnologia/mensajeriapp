import { useState, useEffect, useRef } from 'react';
import { centralDb, bizClients } from '../lib/supabase';
import { Bell, Truck, AlertTriangle, MessageSquare, Clock, ShieldAlert, Volume2, Share2, Timer, User, MapPin, Phone, CreditCard, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState({});
  const [eventModal, setEventModal] = useState(null);
  const [eventType, setEventType] = useState('Entregado');
  const [eventDesc, setEventDesc] = useState('');
  const [now, setNow] = useState(new Date());
  
  const prevOrderIds = useRef([]);
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  const fetchData = async () => {
    setNow(new Date());
    let incomingOrders = [];
    const seventyMinutesAgo = new Date(Date.now() - 70 * 60 * 1000).toISOString();
    
    for (const biz of bizClients) {
      const { data } = await biz.client
        .from('orders_confirmed')
        .select('*')
        .eq('order_status', 'Despachado')
        .neq('customer_address', 'PARA LLEVAR')
        .gte('created_at', seventyMinutesAgo);
      
      if (data) {
        incomingOrders = [...incomingOrders, ...data.map(d => ({ ...d, bizName: biz.name }))];
      }
    }

    const { data: currentDeliveries } = await centralDb
      .from('deliveries')
      .select('order_id');
      
    const assignedIds = currentDeliveries?.map(d => d.order_id) || [];
    const currentPending = incomingOrders.filter(o => !assignedIds.includes(o.id));
    
    const newOrderDetected = currentPending.some(order => !prevOrderIds.current.includes(order.id));
    
    if (newOrderDetected && prevOrderIds.current.length > 0) {
      audioRef.current.play().catch(e => console.log('Audio focus required'));
    }

    prevOrderIds.current = currentPending.map(o => o.id);
    setPendingOrders(currentPending);

    const { data: deliveriesData } = await centralDb
      .from('deliveries')
      .select('*, events(*), drivers(name, phone)')
      .not('status', 'in', '("Entregado","Cancelado")')
      .order('created_at', { ascending: false });
      
    if (deliveriesData) setActiveDeliveries(deliveriesData);

    const { data: driversData } = await centralDb
      .from('drivers')
      .select('*')
      .eq('status', 'Disponible');
      
    if (driversData) setDrivers(driversData);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const sendWhatsApp = (delivery) => {
    const message = `*NUEVO SERVICIO - ${delivery.business_name.toUpperCase()}*\n\n` +
      `*Cliente:* ${delivery.customer_name}\n` +
      `*Dirección:* ${delivery.customer_address}\n` +
      `*Teléfono:* ${delivery.phone}\n` +
      `*Total a cobrar:* $${Number(delivery.total_amount).toLocaleString()}\n` +
      `*Método:* ${delivery.payment_method}\n\n` +
      `_Favor confirmar entrega._`;

    const encodedMessage = encodeURIComponent(message);
    const phone = delivery.drivers.phone.replace(/\D/g, '');
    
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, 'WhatsAppWindow');
  };

  const assignDriver = async (order) => {
    const driverId = selectedDriver[order.id];
    if (!driverId) return;

    await centralDb.from('deliveries').insert({
      business_name: order.bizName,
      order_id: order.id,
      driver_id: driverId,
      customer_name: order.customer_name,
      customer_address: order.customer_address,
      phone: order.phone,
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      status: 'Asignado'
    });
    
    fetchData();
  };

  const handleEventSubmit = async () => {
    if (!eventModal) return;

    await centralDb.from('events').insert({
      delivery_id: eventModal.id,
      event_type: eventType,
      description: eventDesc
    });

    if (eventType === 'Entregado' || eventType === 'Cancelado') {
      await centralDb.from('deliveries')
        .update({ status: eventType, completed_at: new Date().toISOString() })
        .eq('id', eventModal.id);

      const targetBiz = bizClients.find(biz => biz.name === eventModal.business_name);
      if (targetBiz) {
        await targetBiz.client
          .from('orders_confirmed')
          .update({ order_status: eventType })
          .eq('id', eventModal.order_id);
      }
    }

    setEventModal(null);
    setEventType('Entregado');
    setEventDesc('');
    fetchData();
  };

  const getElapsedTime = (createdAt) => {
    return Math.floor((now - new Date(createdAt)) / 60000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/t_traigo.jpg" alt="Logo" className="h-10 w-auto object-contain" />
          <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight uppercase">Panel de Control</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-green-700 uppercase">Sistema Online</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <div className="relative">
              <Bell className="text-red-500 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Nuevos Servicios</h2>
            <div className="flex items-center gap-2 ml-auto">
              <Volume2 size={16} className="text-gray-400" />
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-bold">
                {pendingOrders.length}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {pendingOrders.map(order => {
              const waitTime = getElapsedTime(order.created_at);
              const isUrgent = waitTime >= 30;

              return (
                <div key={order.id} className={`border rounded-lg p-4 transition-all duration-300 ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-slate-800 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                          {order.bizName}
                        </span>
                        {isUrgent && (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-600 animate-bounce">
                            <Clock size={14} /> {waitTime} min
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold mt-2 text-gray-900">{order.customer_name}</h3>
                      <p className="text-sm text-gray-600 leading-tight">{order.customer_address}</p>
                      <p className="text-sm font-semibold text-blue-600 mt-1">{order.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-green-700">${Number(order.total_amount).toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{order.payment_method}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <select 
                      className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                      onChange={(e) => setSelectedDriver({...selectedDriver, [order.id]: e.target.value})}
                      defaultValue=""
                    >
                      <option value="" disabled>Seleccionar Domiciliario</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} — {d.vehicle}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => assignDriver(order)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95"
                    >
                      Asignar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <Truck className="text-blue-500" />
            <h2 className="text-xl font-bold text-gray-800">Servicios en Ruta</h2>
          </div>

          <div className="space-y-4">
            {activeDeliveries.map(delivery => {
              const travelTime = getElapsedTime(delivery.created_at);
              const isLate = travelTime >= 20;

              return (
                <div key={delivery.id} className={`border-2 rounded-xl p-5 transition-all duration-300 ${isLate ? 'bg-orange-50 border-orange-300 shadow-orange-100' : 'bg-white border-blue-100 shadow-sm'}`}>
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Domiciliario</p>
                          <h3 className="font-black text-gray-900 text-lg uppercase leading-none">{delivery.drivers?.name}</h3>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${isLate ? 'bg-orange-600 text-white animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
                        <Timer size={14} /> {travelTime} MIN
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Dirección de Entrega</p>
                            <p className="text-sm font-bold text-gray-800 leading-tight">{delivery.customer_address}</p>
                            <p className="text-xs font-medium text-gray-500">{delivery.customer_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-blue-500 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Teléfono Cliente</p>
                            <p className="text-sm font-black text-blue-700 leading-none">{delivery.phone}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-500">
                            <DollarSign size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Total</span>
                          </div>
                          <span className="font-black text-green-700 text-lg">${Number(delivery.total_amount).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-500">
                            <CreditCard size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Pago</span>
                          </div>
                          <span className="text-[10px] font-black bg-gray-200 px-2 py-0.5 rounded uppercase">{delivery.payment_method}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-[15px] font-black text-black-400 uppercase text-left">Negocio: </p>
                          <p className="text-[12px] font-black text-red-400 uppercase text-left">{delivery.business_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => sendWhatsApp(delivery)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-black transition-all shadow-md active:scale-95"
                      >
                        <Share2 size={18} /> ENVIAR DATOS
                      </button>
                      <button
                        onClick={() => setEventModal(delivery)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-yellow-50 text-yellow-700 py-3 rounded-xl text-sm font-black transition-all border-2 border-yellow-200 active:scale-95"
                      >
                        <MessageSquare size={18} /> NOVEDAD
                      </button>
                    </div>
                  </div>

                  {isLate && (
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-orange-700 bg-orange-100 p-2 rounded-lg border border-orange-200">
                      <AlertTriangle size={14} className="animate-pulse" /> ALERTA: TIEMPO DE RUTA EXCEDIDO
                    </div>
                  )}

                  {delivery.events && delivery.events.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {delivery.events.map(ev => (
                        <div key={ev.id} className="bg-white border-l-4 border-yellow-500 p-3 rounded shadow-sm flex items-start gap-2">
                          <ShieldAlert size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black text-gray-800 text-xs block leading-tight uppercase tracking-tight">{ev.event_type}</span>
                            <span className="text-gray-600 text-xs italic">{ev.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {eventModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-white/20">
            <h3 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">
              <MessageSquare className="text-blue-600" size={24} /> Reporte de WhatsApp
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Estado de la entrega</label>
                <select 
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl p-3.5 outline-none focus:border-blue-500 bg-gray-50 font-bold text-gray-700"
                >
                  <option value="Entregado">Entregado Exitosamente</option>
                  <option value="Direccion no encontrada">Dirección no encontrada</option>
                  <option value="Problema con vehiculo">Problema con vehículo</option>
                  <option value="Cliente no responde">Cliente no responde</option>
                  <option value="Cancelado">Pedido Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Detalles adicionales</label>
                <textarea 
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl p-4 h-32 outline-none focus:border-blue-500 bg-gray-50 resize-none text-sm font-medium"
                  placeholder="Escribe lo que el domiciliario reportó por WhatsApp..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setEventModal(null)} className="flex-1 py-3 text-gray-400 hover:text-gray-600 font-bold transition-colors">Cancelar</button>
              <button onClick={handleEventSubmit} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-200 transition-all active:scale-95">Confirmar Registro</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}