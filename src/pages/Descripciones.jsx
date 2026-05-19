const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, FileText, Loader2, Pencil, Check, X, Tag, Euro } from "lucide-react";
import EmptyState from '@/components/common/EmptyState';
import DeleteConfirm from '@/components/common/DeleteConfirm';

function ListaItems({ items, editingId, editingValues, onStartEdit, onChangeEdit, onSaveEdit, onCancelEdit, onDelete, updatePending, color = 'amber' }) {
    const colors = {
        amber: { badge: 'bg-amber-50 text-amber-600', hover: 'hover:border-amber-200', editBtn: 'hover:text-amber-600 hover:bg-amber-50', saveBtn: 'bg-amber-500 hover:bg-amber-600' },
        violet: { badge: 'bg-violet-50 text-violet-600', hover: 'hover:border-violet-200', editBtn: 'hover:text-violet-600 hover:bg-violet-50', saveBtn: 'bg-violet-600 hover:bg-violet-700' }
    }[color];

    return (
        <div className="space-y-2">
            {items.map((item, idx) => (
                <div key={item.id} className={`group bg-white border border-slate-200 rounded-xl px-4 py-3 ${colors.hover} hover:shadow-sm transition-all`}>
                    {editingId === item.id ? (
                        <div className="space-y-2">
                            <Input
                                value={editingValues.titulo ?? editingValues.nombre ?? ''}
                                onChange={(e) => onChangeEdit('titulo', e.target.value)}
                                placeholder="Título..."
                                className="h-8"
                                autoFocus
                            />
                            {editingValues.texto !== undefined && (
                                <Textarea
                                    value={editingValues.texto}
                                    onChange={(e) => onChangeEdit('texto', e.target.value)}
                                    placeholder="Descripción completa..."
                                    rows={2}
                                />
                            )}
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => onSaveEdit(item.id)} disabled={updatePending} className={`${colors.saveBtn} h-8`}>
                                    {updatePending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />Guardar</>}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-8">
                                    <X className="w-4 h-4 mr-1" />Cancelar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-lg ${colors.badge} flex items-center justify-center shrink-0 mt-0.5`}>
                                <span className="text-xs font-semibold">{idx + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 text-sm">{item.titulo || item.nombre}</p>
                                {item.texto && <p className="text-slate-500 text-sm mt-0.5">{item.texto}</p>}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" onClick={() => onStartEdit(item)} className={`h-8 w-8 text-slate-400 ${colors.editBtn}`}>
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => onDelete(item)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function Descripciones() {
    const [tab, setTab] = useState('descripciones');
    const queryClient = useQueryClient();

    // --- Descripciones ---
    const [newTitulo, setNewTitulo] = useState('');
    const [newTexto, setNewTexto] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingValues, setEditingValues] = useState({});
    const [deletingItem, setDeletingItem] = useState(null);

    const { data: descripciones = [], isLoading: loadingDesc } = useQuery({
        queryKey: ['descripciones'],
        queryFn: () => db.entities.DescripcionPredefinida.list('orden'),
        staleTime: 60000,
    });

    const createDesc = useMutation({
        mutationFn: (data) => db.entities.DescripcionPredefinida.create(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['descripciones'] }); setNewTitulo(''); setNewTexto(''); }
    });
    const updateDesc = useMutation({
        mutationFn: ({ id, data }) => db.entities.DescripcionPredefinida.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['descripciones'] }); setEditingId(null); }
    });
    const deleteDesc = useMutation({
        mutationFn: (id) => db.entities.DescripcionPredefinida.delete(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['descripciones'] }); setDeletingItem(null); }
    });

    // --- Clasificaciones ---
    const [newClasif, setNewClasif] = useState('');
    const [editingClasifId, setEditingClasifId] = useState(null);
    const [editingClasifValues, setEditingClasifValues] = useState({});
    const [deletingClasif, setDeletingClasif] = useState(null);

    const { data: clasificaciones = [], isLoading: loadingClasif } = useQuery({
        queryKey: ['clasificaciones'],
        queryFn: () => db.entities.ClasificacionIncidencia.list('orden'),
        staleTime: 60000,
    });

    const createClasif = useMutation({
        mutationFn: (data) => db.entities.ClasificacionIncidencia.create(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clasificaciones'] }); setNewClasif(''); }
    });
    const updateClasif = useMutation({
        mutationFn: ({ id, data }) => db.entities.ClasificacionIncidencia.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clasificaciones'] }); setEditingClasifId(null); }
    });
    const deleteClasif = useMutation({
        mutationFn: (id) => db.entities.ClasificacionIncidencia.delete(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clasificaciones'] }); setDeletingClasif(null); }
    });

    // --- Tarifas ---
    const TARIFAS_CONFIG = [
        { clave: 'precio_hora_ordinaria', label: 'Precio Hora Ordinaria (€)', color: 'blue' },
        { clave: 'precio_hora_extraordinaria', label: 'Precio Hora Extraordinaria (€)', color: 'amber' },
        { clave: 'precio_hora_festiva', label: 'Precio Hora Festiva (€)', color: 'red' },
        { clave: 'precio_salida_extraordinaria', label: 'Precio Salida Extraordinaria (€)', color: 'amber' },
        { clave: 'precio_salida_festiva', label: 'Precio Salida Festivo (€)', color: 'red' },
    ];
    const DEFAULTS = { precio_hora_ordinaria: 0, precio_hora_extraordinaria: 25, precio_hora_festiva: 100, precio_salida_extraordinaria: 0, precio_salida_festiva: 0 };

    const { data: configPrecios = [], isLoading: loadingPrecios } = useQuery({
        queryKey: ['config-precios'],
        queryFn: () => db.entities.ConfigPrecios.list(),
    });

    const upsertPrecio = useMutation({
        mutationFn: async ({ clave, valor, label }) => {
            const existing = configPrecios.find(c => c.clave === clave);
            if (existing) return db.entities.ConfigPrecios.update(existing.id, { valor });
            return db.entities.ConfigPrecios.create({ clave, valor, label });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config-precios'] }),
    });

    const [precioEditing, setPrecioEditing] = useState({});

    const getPrecio = (clave) => {
        const found = configPrecios.find(c => c.clave === clave);
        return found?.valor ?? DEFAULTS[clave] ?? 0;
    };

    const tabItems = [
        { id: 'descripciones', label: 'Descripciones genéricas', icon: FileText },
        { id: 'clasificaciones', label: 'Clasificación de incidentes', icon: Tag },
        { id: 'tarifas', label: 'Tarifas de horas', icon: Euro },
    ];

    return (
        <div className="space-y-5 max-w-2xl mx-auto">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Configuración</h1>
                <p className="text-sm text-slate-400 mt-0.5">Opciones rápidas al crear incidencias</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                {tabItems.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* --- DESCRIPCIONES GENÉRICAS --- */}
            {tab === 'descripciones' && (
                <>
                    <form onSubmit={(e) => { e.preventDefault(); if (!newTitulo.trim() || !newTexto.trim()) return; createDesc.mutate({ titulo: newTitulo.trim(), texto: newTexto.trim(), orden: descripciones.length }); }}
                        className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Nueva descripción predefinida</p>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Título (aparece en el selector)</Label>
                            <Input placeholder="Ej: Semáforo apagado" value={newTitulo} onChange={(e) => setNewTitulo(e.target.value)} className="h-9 bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Descripción completa</Label>
                            <Textarea placeholder="Descripción detallada de la incidencia..." value={newTexto} onChange={(e) => setNewTexto(e.target.value)} rows={3} className="bg-white" />
                        </div>
                        <Button type="submit" disabled={!newTitulo.trim() || !newTexto.trim() || createDesc.isPending} className="bg-amber-500 hover:bg-amber-600 h-9 w-full">
                            {createDesc.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Añadir</>}
                        </Button>
                    </form>

                    {loadingDesc ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-amber-500" /></div>
                    ) : descripciones.length === 0 ? (
                        <EmptyState icon={FileText} title="Sin descripciones predefinidas" description="Añade descripciones para agilizar la creación de incidencias" />
                    ) : (
                        <ListaItems
                            items={descripciones}
                            editingId={editingId}
                            editingValues={editingValues}
                            onStartEdit={(item) => { setEditingId(item.id); setEditingValues({ titulo: item.titulo, texto: item.texto }); }}
                            onChangeEdit={(key, val) => setEditingValues(prev => ({ ...prev, [key]: val }))}
                            onSaveEdit={(id) => { if (!editingValues.titulo?.trim() || !editingValues.texto?.trim()) return; updateDesc.mutate({ id, data: { titulo: editingValues.titulo.trim(), texto: editingValues.texto.trim() } }); }}
                            onCancelEdit={() => setEditingId(null)}
                            onDelete={(item) => setDeletingItem(item)}
                            updatePending={updateDesc.isPending}
                            color="amber"
                        />
                    )}

                    <DeleteConfirm
                        open={!!deletingItem}
                        onClose={() => setDeletingItem(null)}
                        onConfirm={() => deleteDesc.mutate(deletingItem.id)}
                        title="¿Eliminar descripción?"
                        description={`Se eliminará "${deletingItem?.titulo}". Esta acción no se puede deshacer.`}
                    />
                </>
            )}

            {/* --- CLASIFICACIONES --- */}
            {tab === 'clasificaciones' && (
                <>
                    <form onSubmit={(e) => { e.preventDefault(); if (!newClasif.trim()) return; createClasif.mutate({ nombre: newClasif.trim(), orden: clasificaciones.length }); }}
                        className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Nueva clasificación de incidente</p>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Nombre de la clasificación</Label>
                            <Input placeholder="Ej: Avería eléctrica" value={newClasif} onChange={(e) => setNewClasif(e.target.value)} className="h-9 bg-white" />
                        </div>
                        <Button type="submit" disabled={!newClasif.trim() || createClasif.isPending} className="bg-violet-600 hover:bg-violet-700 h-9 w-full">
                            {createClasif.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Añadir</>}
                        </Button>
                    </form>

                    {loadingClasif ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-violet-500" /></div>
                    ) : clasificaciones.length === 0 ? (
                        <EmptyState icon={Tag} title="Sin clasificaciones" description="Añade clasificaciones para categorizar las incidencias" />
                    ) : (
                        <ListaItems
                            items={clasificaciones.map(c => ({ ...c, titulo: c.nombre }))}
                            editingId={editingClasifId}
                            editingValues={editingClasifValues}
                            onStartEdit={(item) => { setEditingClasifId(item.id); setEditingClasifValues({ titulo: item.nombre }); }}
                            onChangeEdit={(key, val) => setEditingClasifValues(prev => ({ ...prev, [key]: val }))}
                            onSaveEdit={(id) => { if (!editingClasifValues.titulo?.trim()) return; updateClasif.mutate({ id, data: { nombre: editingClasifValues.titulo.trim() } }); }}
                            onCancelEdit={() => setEditingClasifId(null)}
                            onDelete={(item) => setDeletingClasif(item)}
                            updatePending={updateClasif.isPending}
                            color="violet"
                        />
                    )}

                    <DeleteConfirm
                        open={!!deletingClasif}
                        onClose={() => setDeletingClasif(null)}
                        onConfirm={() => deleteClasif.mutate(deletingClasif.id)}
                        title="¿Eliminar clasificación?"
                        description={`Se eliminará "${deletingClasif?.nombre}". Esta acción no se puede deshacer.`}
                    />
                </>
            )}

            {/* --- TARIFAS --- */}
            {tab === 'tarifas' && (
                <div className="space-y-3">
                    <p className="text-sm text-slate-500">Define el precio por incidencia según el tipo de horas. Se usa para calcular el importe mensual.</p>
                    {loadingPrecios ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>
                    ) : (
                        TARIFAS_CONFIG.map(({ clave, label }) => {
                            const currentVal = getPrecio(clave);
                            const editVal = precioEditing[clave];
                            const isEditing = editVal !== undefined;
                            return (
                                <div key={clave} className="group bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-all">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-700">{label}</p>
                                        {!isEditing && (
                                            <p className="text-slate-500 text-sm mt-0.5">{currentVal} €</p>
                                        )}
                                        {isEditing && (
                                            <div className="flex gap-2 mt-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={editVal}
                                                    onChange={e => setPrecioEditing(prev => ({ ...prev, [clave]: e.target.value }))}
                                                    className="h-8 w-32"
                                                    autoFocus
                                                />
                                                <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700"
                                                    onClick={() => {
                                                        upsertPrecio.mutate({ clave, valor: parseFloat(editVal) || 0, label });
                                                        setPrecioEditing(prev => { const n = {...prev}; delete n[clave]; return n; });
                                                    }}>
                                                    <Check className="w-4 h-4 mr-1" />Guardar
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8"
                                                    onClick={() => setPrecioEditing(prev => { const n = {...prev}; delete n[clave]; return n; })}>
                                                    <X className="w-4 h-4 mr-1" />Cancelar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {!isEditing && (
                                        <Button size="icon" variant="ghost"
                                            onClick={() => setPrecioEditing(prev => ({ ...prev, [clave]: currentVal }))}
                                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}