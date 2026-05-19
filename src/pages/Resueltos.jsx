const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle2, Loader2, AlertTriangle, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportIncidenciasToDocx } from '@/components/incidencias/ExportDocx';
import IncidenciaCard from '@/components/incidencias/IncidenciaCard';
import IncidenciaForm from '@/components/incidencias/IncidenciaForm';
import SeguimientoModal from '@/components/incidencias/SeguimientoModal';
import ResolucionModal from '@/components/incidencias/ResolucionModal';
import DeleteConfirm from '@/components/common/DeleteConfirm';
import EmptyState from '@/components/common/EmptyState';
import ResumenHoras from '@/components/incidencias/ResumenHoras';

export default function Resueltos() {
    const [editingIncidencia, setEditingIncidencia] = useState(null);
    const [deletingIncidencia, setDeletingIncidencia] = useState(null);
    const [seguimientoIncidencia, setSeguimientoIncidencia] = useState(null);
    const [resolvingIncidencia, setResolvingIncidencia] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [filterMonth, setFilterMonth] = useState('all');
    const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
    const [exporting, setExporting] = useState(false);
    
    const queryClient = useQueryClient();

    const { data: incidencias = [], isLoading: loadingIncidencias, isError: errorIncidencias } = useQuery({
        queryKey: ['incidencias'],
        queryFn: () => db.entities.Incidencia.list('-updated_date'),
        staleTime: 30000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnMount: false,
        refetchOnWindowFocus: false
    });

    const { data: semaforos = [], isError: errorSemaforos } = useQuery({
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

    const handleEdit = (incidencia) => {
        setEditingIncidencia(incidencia);
        setShowForm(true);
    };

    const handleSave = (data) => {
        updateMutation.mutate({ id: editingIncidencia.id, data });
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

    // Get available years from data
    const availableYears = [...new Set(
        incidencias
            .filter(inc => inc.estado === 'Resuelto' && inc.fecha_resolucion)
            .map(inc => new Date(inc.fecha_resolucion).getFullYear())
    )].sort((a, b) => b - a);

    // Filter only resolved, ordered by fecha_incidente desc
    const resueltas = incidencias
        .filter(inc => inc.estado === 'Resuelto')
        .sort((a, b) => new Date(b.fecha_incidente) - new Date(a.fecha_incidente))
        .filter(inc => {
            const fecha = inc.fecha_resolucion ? new Date(inc.fecha_resolucion) : null;
            if (filterYear !== 'all' && fecha && fecha.getFullYear() !== Number(filterYear)) return false;
            if (filterMonth !== 'all' && fecha && fecha.getMonth() !== Number(filterMonth)) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return inc.semaforo_codigo?.toLowerCase().includes(term) ||
                       inc.descripcion?.toLowerCase().includes(term);
            }
            return true;
        });

    const canExport = filterYear !== 'all';

    const handleExportAll = async () => {
        setExporting(true);
        const label = filterMonth !== 'all'
            ? `${format(new Date(2000, Number(filterMonth), 1), 'MMMM', { locale: es })} ${filterYear}`
            : `año ${filterYear}`;
        await exportIncidenciasToDocx(resueltas, label);
        setExporting(false);
    };

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
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Resueltas</h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        {resueltas.length} {resueltas.length === 1 ? 'incidencia' : 'incidencias'}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por semáforo o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 bg-white border-slate-200 rounded-xl text-sm"
                    />
                </div>
                <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setFilterMonth('all'); }}>
                    <SelectTrigger className="h-10 w-full sm:w-32 bg-white border-slate-200 rounded-xl text-sm">
                        <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los años</SelectItem>
                        {availableYears.map(y => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="h-10 w-full sm:w-36 bg-white border-slate-200 rounded-xl text-sm">
                        <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los meses</SelectItem>
                        {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>
                                {format(new Date(2000, i, 1), 'MMMM', { locale: es })}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {canExport && resueltas.length > 0 && (
                    <Button
                        onClick={handleExportAll}
                        disabled={exporting}
                        className="h-10 bg-emerald-600 hover:bg-emerald-700 shrink-0 rounded-xl text-sm shadow-sm shadow-emerald-200"
                    >
                        {exporting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        {filterMonth !== 'all' ? 'Exportar mes' : 'Exportar año'}
                    </Button>
                )}
            </div>

            {/* Resumen de horas (solo cuando hay mes seleccionado) */}
            {filterMonth !== 'all' && (
                <ResumenHoras mes={Number(filterMonth)} anio={Number(filterYear)} />
            )}

            {/* Content */}
            {loadingIncidencias ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
                </div>
            ) : resueltas.length === 0 ? (
                <EmptyState
                    icon={CheckCircle2}
                    title={searchTerm ? "Sin resultados" : "No hay incidencias resueltas"}
                    description={searchTerm ? "Intenta con otro término de búsqueda" : "Las incidencias marcadas como resueltas aparecerán aquí"}
                />
            ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                    {resueltas.map(incidencia => (
                        <IncidenciaCard
                            key={incidencia.id}
                            incidencia={incidencia}
                            onEdit={handleEdit}
                            onDelete={setDeletingIncidencia}
                            onStatusChange={handleStatusChange}
                            onOpenSeguimiento={setSeguimientoIncidencia}
                            showExport={true}
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
                isLoading={updateMutation.isPending}
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
                description="Se eliminará permanentemente esta incidencia resuelta. Esta acción no se puede deshacer."
            />
        </div>
    );
}