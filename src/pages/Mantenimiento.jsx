const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useRef } from 'react';

import { useQuery } from '@tanstack/react-query';
import ZonaEditModal from '@/components/mantenimiento/ZonaEditModal';
import { Pencil, MapPin, TrafficCone, X, ExternalLink, Image as ImageIcon } from 'lucide-react';

// Polígonos con las rutas SVG exactas del mapa
const POLIGONOS = [
{
  zona_key: 'zona1',
  defaultNombre: 'Zona Norte',
  d: 'M 11.33 4.65 L 12.34 4.8 L 12.24 6.5 L 12 7.45 L 10.5 8.9 L 9.5 9.25 L 7.79 9.1 L 7.77 8.6 Z',
  labelX: 10.3,
  labelY: 7.2
},
{
  zona_key: 'zona2',
  defaultNombre: 'Zona Centro',
  d: 'M 12 8.6 L 14 9 L 14 10 L 12.2 10 L 12.2 10.7 L 11.3 10.7 L 11.2 11.3 L 9.3 11 L 7.65 11 L 7.65 9.7 L 10.9 9.4 Z',
  labelX: 11.0,
  labelY: 10.2
},
{
  zona_key: 'zona3',
  defaultNombre: 'Zona Sur',
  d: 'M 5 14.5 L 8.1 17.7 L 6.9 19.6 L 4.2 16.3 L 4.4 15.1 Z',
  labelX: 5.7,
  labelY: 16.8
}];

export default function Mantenimiento() {
  const [editZona, setEditZona] = useState(null);
  const [selectedZona, setSelectedZona] = useState(null); // zona_key seleccionada para ver semáforos
  const [hoveredKey, setHoveredKey] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const { data: zonas = [], refetch: refetchZonas } = useQuery({
    queryKey: ['zonas'],
    queryFn: () => db.entities.Zona.list()
  });

  const { data: semaforos = [] } = useQuery({
    queryKey: ['semaforos-mant'],
    queryFn: () => db.entities.Semaforo.list()
  });

  const getZona = (zona_key) => zonas.find((z) => z.zona_key === zona_key);

  const handleMouseMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const hoveredPoli = POLIGONOS.find((p) => p.zona_key === hoveredKey);
  const hoveredZona = hoveredPoli ? getZona(hoveredPoli.zona_key) : null;
  const tooltipName = hoveredZona?.nombre || hoveredPoli?.defaultNombre || '';
  const tooltipCount = hoveredZona?.semaforos_ids?.length ?? 0;

  return (
    <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Mantenimiento</h1>
                    <p className="text-sm text-slate-500">Zonas de trabajo en el mapa</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <p className="text-sm text-slate-500 mb-4">Haz clic en una zona para editarla. Pasa el ratón para ver detalles.</p>
                <div
          className="relative inline-block w-full max-w-lg mx-auto"
          style={{ display: 'block' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredKey(null)}>
          
                    <img
                       src="https://media.db.com/images/public/69413d9632a7348936e90d63/ee3b3f315_semaforos.png"
            alt="Mapa zonas"
            className="w-full h-auto block"
            draggable={false} />
          
                    <svg
            ref={svgRef}
            viewBox="2.5 0 15 20" className="absolute inset-0 w-full h-full"

            style={{ cursor: 'pointer' }}>
            
                        {POLIGONOS.map((poli) => {
              const zona = getZona(poli.zona_key);
              const isHovered = hoveredKey === poli.zona_key;
              const count = zona?.semaforos_ids?.length ?? 0;
              return (
                <g key={poli.zona_key}>
                                    <path
                    d={poli.d}
                    fill={isHovered ? 'rgba(16,185,129,0.55)' : 'rgba(16,185,129,0.25)'}
                    stroke="rgba(5,150,105,0.8)"
                    strokeWidth={isHovered ? 0.15 : 0.08}
                    onMouseEnter={() => setHoveredKey(poli.zona_key)}
                    onClick={() => setSelectedZona(poli.zona_key)}
                    style={{ transition: 'fill 0.15s' }} />
                  
                                    {count > 0 &&
                  <text
                    x={poli.labelX}
                    y={poli.labelY}
                    textAnchor="middle"
                    fontSize="0.5"
                    fontWeight="bold"
                    fill="rgba(5,100,70,0.9)"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    
                                            {count}
                                        </text>
                  }
                                </g>);

            })}
                    </svg>

                    {/* Tooltip */}
                    {hoveredKey &&
          <div
            className="absolute bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none z-10 whitespace-nowrap"
            style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}>
            
                            <div className="font-semibold">{tooltipName}</div>
                            <div className="flex items-center gap-1 text-slate-300 mt-0.5">
                                <TrafficCone className="w-3 h-3" />
                                {tooltipCount} semáforo{tooltipCount !== 1 ? 's' : ''}
                            </div>
                        </div>
          }
                </div>
            </div>

            {/* Panel semáforos de la zona seleccionada */}
            {selectedZona && (() => {
                const poli = POLIGONOS.find(p => p.zona_key === selectedZona);
                const zona = getZona(selectedZona);
                const nombre = zona?.nombre || poli?.defaultNombre || '';
                const ids = zona?.semaforos_ids || [];
                const semaforosZona = semaforos.filter(s => ids.includes(s.id));
                return (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                <h2 className="font-semibold text-slate-700">{nombre}</h2>
                                <span className="text-sm text-slate-400">({semaforosZona.length} semáforo{semaforosZona.length !== 1 ? 's' : ''})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditZona({ zona_key: selectedZona, ...(zona || { nombre: poli?.defaultNombre, semaforos_ids: [] }) })}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Editar zona"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setSelectedZona(null)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        {semaforosZona.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-slate-400">No hay semáforos asignados a esta zona.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {semaforosZona.map(s => (
                                    <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                                        <div className="w-1.5 self-stretch rounded bg-gradient-to-b from-emerald-500 via-amber-400 to-red-500" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-slate-800 text-sm">{s.codigo}</div>
                                            <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{s.direccion}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {s.enlace_maps && (
                                                <a href={s.enlace_maps} target="_blank" rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="Google Maps">
                                                    <MapPin className="w-4 h-4" />
                                                </a>
                                            )}
                                            {s.enlace_imagen && (
                                                <a href={s.enlace_imagen} target="_blank" rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                                                    title="Imagen cuadro eléctrico">
                                                    <ImageIcon className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Tabla resumen */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-700">Resumen de zonas</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {POLIGONOS.map((poli) => {
            const zona = getZona(poli.zona_key);
            const nombre = zona?.nombre || poli.defaultNombre;
            const count = zona?.semaforos_ids?.length ?? 0;
            return (
              <div key={poli.zona_key} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                    <span className="font-medium text-slate-700">{nombre}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-slate-500">{count} semáforo{count !== 1 ? 's' : ''}</span>
                                    <button
                    onClick={() => setEditZona({ zona_key: poli.zona_key, ...(zona || { nombre: poli.defaultNombre, semaforos_ids: [] }) })}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>);

          })}
                </div>
            </div>

            {editZona &&
      <ZonaEditModal
        zona={editZona}
        semaforos={semaforos}
        onClose={() => setEditZona(null)}
        onSaved={() => {refetchZonas();setEditZona(null);}} />

      }
        </div>);

}