const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, TrafficCone, Loader2, AlertTriangle } from "lucide-react";
import SemaforoCard from '@/components/semaforos/SemaforoCard';
import SemaforoForm from '@/components/semaforos/SemaforoForm';
import DeleteConfirm from '@/components/common/DeleteConfirm';
import EmptyState from '@/components/common/EmptyState';

export default function Semaforos() {
    const [showForm, setShowForm] = useState(false);
    const [editingSemaforo, setEditingSemaforo] = useState(null);
    const [deletingSemaforo, setDeletingSemaforo] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const queryClient = useQueryClient();

    const { data: semaforos = [], isLoading, isError } = useQuery({
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
        mutationFn: (data) => db.entities.Semaforo.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['semaforos'] });
            setShowForm(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => db.entities.Semaforo.update(id, data),
        onSuccess: (updatedSemaforo) => {
            queryClient.setQueryData(['semaforos'], (old) => {
                if (!old) return old;
                const updated = old.map(sem => sem.id === updatedSemaforo.id ? updatedSemaforo : sem);
                return updated.sort((a, b) => a.codigo.localeCompare(b.codigo));
            });
            setShowForm(false);
            setEditingSemaforo(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => db.entities.Semaforo.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['semaforos'] });
            setDeletingSemaforo(null);
        }
    });

    const handleSave = (data) => {
        if (editingSemaforo) {
            updateMutation.mutate({ id: editingSemaforo.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (semaforo) => {
        setEditingSemaforo(semaforo);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingSemaforo(null);
    };

    const filteredSemaforos = semaforos.filter(sem => 
        sem.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sem.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isError) {
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
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Semáforos</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Inventario de semáforos</p>
                </div>
                <Button 
                    onClick={() => setShowForm(true)}
                    className="bg-blue-500 hover:bg-blue-600 h-10 px-4 rounded-xl shadow-sm shadow-blue-200 text-sm"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">Nuevo </span>Semáforo
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Buscar por código o dirección..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 bg-white border-slate-200 rounded-xl text-sm"
                />
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
                </div>
            ) : filteredSemaforos.length === 0 ? (
                <EmptyState
                    icon={TrafficCone}
                    title={searchTerm ? "Sin resultados" : "No hay semáforos registrados"}
                    description={searchTerm ? "Intenta con otro término de búsqueda" : "Añade tu primer semáforo para comenzar"}
                />
            ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSemaforos.map(semaforo => (
                        <SemaforoCard
                            key={semaforo.id}
                            semaforo={semaforo}
                            onEdit={handleEdit}
                            onDelete={setDeletingSemaforo}
                        />
                    ))}
                </div>
            )}

            {/* Forms & Dialogs */}
            <SemaforoForm
                open={showForm}
                onClose={handleCloseForm}
                onSave={handleSave}
                semaforo={editingSemaforo}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            <DeleteConfirm
                open={!!deletingSemaforo}
                onClose={() => setDeletingSemaforo(null)}
                onConfirm={() => deleteMutation.mutate(deletingSemaforo.id)}
                title="¿Eliminar semáforo?"
                description={`Se eliminará permanentemente el semáforo "${deletingSemaforo?.codigo}". Esta acción no se puede deshacer.`}
            />
        </div>
    );
}