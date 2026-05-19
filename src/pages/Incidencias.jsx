const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, AlertTriangle, Loader2 } from "lucide-react";
import IncidenciaCard from '@/components/incidencias/IncidenciaCard';
import IncidenciaForm from '@/components/incidencias/IncidenciaForm';
import SeguimientoModal from '@/components/incidencias/SeguimientoModal';
import ResolucionModal from '@/components/incidencias/ResolucionModal';
import DeleteConfirm from '@/components/common/DeleteConfirm';
import EmptyState from '@/components/common/EmptyState';

export default function Incidencias() {
    const [showForm, setShowForm] = useState(false);
    const [editingIncidencia, setEditingIncidencia] = useState(null);
    const [deletingIncidencia, setDeletingIncidencia] = useState(null);
    const [seguimientoIncidencia, setSeguimientoIncidencia] = useState(null);
    const [resolvingIncidencia, setResolvingIncidencia] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('all');
    
    const queryClient = useQueryClient();

    const { data: incidencias = [], isLoading: loadingIncidencias, isError: errorIncidencias } = useQuery({
        queryKey: ['incidencias'],
        queryFn: () => db.entities.Incidencia.list('-created_date'),
        staleTime: 30000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnMount: false,
        refetchOnWindowFocus: false
    });

    const { data: semaforos = [], isLoading: loadingSemaforos, isError: errorSemaforos } = useQuery({
        queryKey: ['semaforos'],
        queryFn: async () => {
            const data = await db.entities.Semaforo.list();
            return data.sort((a, b) => a.codigo.localeCompare(b.codigo));
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnMount: false,
        refetchOnWindowFocus: false
    });

    const createMutation = useMutation({
        mutationFn: (data) => db.entities.Incidencia.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidencias'] });
            setShowForm(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => db.entities.Incidencia.update(id, data),
        onSuccess: (updatedIncidencia) => {
            queryClient.setQueryData(['incidencias'], (old) => {
                if (!old) return old;
                return old.map(inc => inc.id === updatedIncidencia.id ? updatedIncidencia : inc);
            });
            setShowForm(false);
            setEditingIncidencia(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => db.entities.Incidencia.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidencias'] });
            setDeletingIncidencia(null);
        }
    });

    const handleSave = (data) => {
        if (editingIncidencia) {
            updateMutation.mutate({ id: editingIncidencia.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (incidencia) => {
        setEditingIncidencia(incidencia);
        setShowForm(true);
    };

    const handleStatusChange = (incidencia, newStatus) => {
        if (newStatus === 'Resuelto' && incidencia.estado === 'Pendiente') {
            setResolvingIncidencia(incidencia);
        } else {
            updateMutation.mutate({ 
                id: incidencia.id, 
                data: { ...incidencia, estado: newStatus, fecha_resolucion: newStatus === 'Pendiente' ? null : incidencia.fecha_resolucion } 
            });
        }
    };

    const handleConfirmResolucion = (fechaResolucion) => {
        updateMutation.mutate({ 
            id: resolvingIncidencia.id, 
            data: { ...resolvingIncidencia, estado: 'Resuelto', fecha_resolucion: fechaResolucion } 
        });
        setResolvingIncidencia(null);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingIncidencia(null);
    };

    const handleSaveSeguimiento = (data) => {
        updateMutation.mutate({ 
            id: seguimientoIncidencia.id, 
            data: { ...seguimientoIncidencia, ...data } 
        });
        setSeguimientoIncidencia(null);
    };

    // Filter incidencias - exclude "Resuelto" by default
    const filteredIncidencias = incidencias
        .filter(inc => inc.estado !== 'Resuelto')
        .filter(inc => {
            if (filterEstado !== 'all' && inc.estado !== filterEstado) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return inc.semaforo_codigo?.toLowerCase().includes(term) ||
                       inc.descripcion?.toLowerCase().includes(term);
            }
            return true;
        });

    const pendingCount = incidencias.filter(i => i.estado === 'Pendiente').length;

    const isLoading = loadingIncidencias || loadingSemaforos;
    const hasError = errorIncidencias || errorSemaforos;

    if (hasError) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Error al cargar datos</h2>
                <p className="text-slate-600">Por favor, recarga la página</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Incidencias</h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
                    </p>
                </div>
                <Button 
                    onClick={() => setShowForm(true)}
                    className="bg-amber-500 hover:bg-amber-600 h-10 px-4 rounded-xl shadow-sm shadow-amber-200 text-sm"
                    disabled={semaforos.length === 0}
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">Nueva </span>Incidencia
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Buscar por semáforo o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 bg-white border-slate-200 rounded-xl text-sm"
                />
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                </div>
            ) : semaforos.length === 0 ? (
                <EmptyState
                    icon={AlertTriangle}
                    title="Primero añade semáforos"
                    description="Debes registrar al menos un semáforo antes de crear incidencias"
                />
            ) : filteredIncidencias.length === 0 ? (
                <EmptyState
                    icon={AlertTriangle}
                    title={searchTerm ? "Sin resultados" : "No hay incidencias activas"}
                    description={searchTerm ? "Intenta con otros filtros" : "¡Excelente! No hay incidencias pendientes"}
                />
            ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                    {filteredIncidencias.map(incidencia => (
                        <IncidenciaCard
                            key={incidencia.id}
                            incidencia={incidencia}
                            onEdit={handleEdit}
                            onDelete={setDeletingIncidencia}
                            onStatusChange={handleStatusChange}
                            onOpenSeguimiento={setSeguimientoIncidencia}
                        />
                    ))}
                </div>
            )}

            {/* Forms & Dialogs */}
            <IncidenciaForm
                open={showForm}
                onClose={handleCloseForm}
                onSave={handleSave}
                incidencia={editingIncidencia}
                semaforos={semaforos}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            <SeguimientoModal
                open={!!seguimientoIncidencia}
                onClose={() => setSeguimientoIncidencia(null)}
                incidencia={seguimientoIncidencia}
                onSave={handleSaveSeguimiento}
                isLoading={updateMutation.isPending}
            />

            <ResolucionModal
                open={!!resolvingIncidencia}
                onClose={() => setResolvingIncidencia(null)}
                onConfirm={handleConfirmResolucion}
                isLoading={updateMutation.isPending}
            />

            <DeleteConfirm
                open={!!deletingIncidencia}
                onClose={() => setDeletingIncidencia(null)}
                onConfirm={() => deleteMutation.mutate(deletingIncidencia.id)}
                title="¿Eliminar incidencia?"
                description="Se eliminará permanentemente esta incidencia. Esta acción no se puede deshacer."
            />
        </div>
    );
}