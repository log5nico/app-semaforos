const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, Euro } from 'lucide-react';

const TIPOS = [
    { key: 'Ordinarias', label: 'Horas Ordinarias', color: '#3b82f6' },
    { key: 'Extraordinarias', label: 'Horas Extraordinarias', color: '#f59e0b' },
    { key: 'Festivas', label: 'Horas Festivas', color: '#ef4444' },
];

const SALIDAS = [
    { key: 'Extraordinarias', label: 'Salidas Extraordinarias', color: '#f59e0b', clave: 'precio_salida_extraordinaria' },
    { key: 'Festivas', label: 'Salidas Festivos', color: '#ef4444', clave: 'precio_salida_festiva' },
];

const PRECIOS_DEFAULT = {
    precio_hora_ordinaria: 0,
    precio_hora_extraordinaria: 25,
    precio_hora_festiva: 100,
    precio_salida_extraordinaria: 0,
    precio_salida_festiva: 0,
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function ResumenHoras({ mes: mesProp, anio: anioProp }) {
    const now = new Date();
    const [mes, setMes] = useState(mesProp ?? now.getMonth());
    const [anio, setAnio] = useState(anioProp ?? now.getFullYear());
    const controlled = mesProp !== undefined;

    // Sync with parent props
    React.useEffect(() => { if (mesProp !== undefined) setMes(mesProp); }, [mesProp]);
    React.useEffect(() => { if (anioProp !== undefined) setAnio(anioProp); }, [anioProp]);

    const { data: incidencias = [] } = useQuery({
        queryKey: ['incidencias-horas'],
        queryFn: () => db.entities.Incidencia.list(),
    });

    const { data: configPrecios = [] } = useQuery({
        queryKey: ['config-precios'],
        queryFn: () => db.entities.ConfigPrecios.list(),
    });

    // Resolve precios: from DB or default
    const getPrice = (clave) => {
        const found = configPrecios.find(c => c.clave === clave);
        return found?.valor ?? PRECIOS_DEFAULT[clave]?.valor ?? 0;
    };

    const precios = {
        Ordinarias: getPrice('precio_hora_ordinaria'),
        Extraordinarias: getPrice('precio_hora_extraordinaria'),
        Festivas: getPrice('precio_hora_festiva'),
    };

    const preciosSalidas = {
        Extraordinarias: getPrice('precio_salida_extraordinaria'),
        Festivas: getPrice('precio_salida_festiva'),
    };

    // Filter incidencias by month/year
    const filtered = incidencias.filter(inc => {
        if (!inc.tipo_horas) return false;
        const d = new Date(inc.fecha_incidente);
        return d.getMonth() === mes && d.getFullYear() === anio;
    });

    // Calcula horas reales: fecha_resolucion - fecha_incidente
    const calcHoras = (inc) => {
        if (!inc.fecha_resolucion || !inc.fecha_incidente) return 0;
        const diff = new Date(inc.fecha_resolucion) - new Date(inc.fecha_incidente);
        return Math.max(0, diff / (1000 * 60 * 60));
    };

    const horasPorTipo = {
        Ordinarias: filtered.filter(i => i.tipo_horas === 'Ordinarias').reduce((s, i) => s + calcHoras(i), 0),
        Extraordinarias: filtered.filter(i => i.tipo_horas === 'Extraordinarias').reduce((s, i) => s + calcHoras(i), 0),
        Festivas: filtered.filter(i => i.tipo_horas === 'Festivas').reduce((s, i) => s + calcHoras(i), 0),
    };

    const chartData = TIPOS.map(t => ({
        name: t.key,
        horas: Math.round(horasPorTipo[t.key] * 100) / 100,
        importe: horasPorTipo[t.key] * precios[t.key],
        color: t.color,
    }));

    const salidasPorTipo = {
        Extraordinarias: filtered.filter(i => i.tipo_horas === 'Extraordinarias').length,
        Festivas: filtered.filter(i => i.tipo_horas === 'Festivas').length,
    };

    const totalImporteSalidas = SALIDAS.reduce((sum, s) => sum + salidasPorTipo[s.key] * preciosSalidas[s.key], 0);
    const totalImporte = chartData.reduce((sum, d) => sum + d.importe, 0) + totalImporteSalidas;

    const anios = [];
    for (let y = 2023; y <= now.getFullYear() + 1; y++) anios.push(y);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <h2 className="font-semibold text-slate-700">Resumen de Horas</h2>
                </div>
                {!controlled && (
                    <div className="flex gap-2">
                        <select
                            value={mes}
                            onChange={e => setMes(Number(e.target.value))}
                            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700"
                        >
                            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <select
                            value={anio}
                            onChange={e => setAnio(Number(e.target.value))}
                            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700"
                        >
                            {anios.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* Cards resumen */}
            <div className="grid grid-cols-3 gap-3">
                {TIPOS.map(t => (
                    <div key={t.key} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                        <div className="text-xs text-slate-500 mb-1 leading-tight">{t.label}</div>
                        <div className="text-2xl font-bold" style={{ color: t.color }}>{horasPorTipo[t.key].toFixed(1)}h</div>
                        <div className="text-xs text-slate-400 mt-0.5">{(horasPorTipo[t.key] * precios[t.key]).toFixed(2)} €</div>
                    </div>
                ))}
            </div>

            {/* Cards salidas */}
            <div className="grid grid-cols-2 gap-3">
                {SALIDAS.map(s => (
                    <div key={s.key} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                        <div className="text-xs text-slate-500 mb-1 leading-tight">{s.label}</div>
                        <div className="text-2xl font-bold" style={{ color: s.color }}>{salidasPorTipo[s.key]}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{(salidasPorTipo[s.key] * preciosSalidas[s.key]).toFixed(2)} €</div>
                    </div>
                ))}
            </div>

            {/* Gráfico */}
            {filtered.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                            formatter={(val, name, props) => [`${val}h — ${props.payload.importe.toFixed(2)} €`, '']}
                        />
                        <Bar dataKey="horas" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="text-center text-sm text-slate-400 py-6">Sin registros con tipo de horas en {MESES[mes]} {anio}</div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Euro className="w-4 h-4 text-emerald-500" />
                    Total importe {MESES[mes]} {anio}
                </div>
                <div className="text-lg font-bold text-emerald-600">{totalImporte.toFixed(2)} €</div>
            </div>
        </div>
    );
}