const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';

export default function IncidenciaForm({ open, onClose, onSave, incidencia, semaforos, isLoading }) {
    const [openCombo, setOpenCombo] = useState(false);
    const [descripcionMode, setDescripcionMode] = useState('predefinida'); // 'predefinida' | 'otro'

    const { data: descripciones = [] } = useQuery({
        queryKey: ['descripciones'],
        queryFn: () => db.entities.DescripcionPredefinida.list('orden'),
        staleTime: 60000,
    });

    const { data: clasificaciones = [] } = useQuery({
        queryKey: ['clasificaciones'],
        queryFn: () => db.entities.ClasificacionIncidencia.list('orden'),
        staleTime: 60000,
    });

    const [formData, setFormData] = useState({
        semaforo_id: '',
        semaforo_codigo: '',
        descripcion: '',
        clasificacion_id: '',
        clasificacion_nombre: '',
        fecha_incidente: new Date().toISOString().slice(0, 16),
        estado: 'Pendiente',
        tipo_horas: ''
    });

    // Formatea fecha a "YYYY-MM-DDTHH:mm" respetando la hora local (no UTC)
    const toLocalDateTimeInput = (dateStr) => {
        if (!dateStr) return new Date(new Date() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        const d = new Date(dateStr);
        return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    useEffect(() => {
        if (incidencia) {
                const fechaIncidente = toLocalDateTimeInput(incidencia.fecha_incidente);
                const fechaResolucion = incidencia.fecha_resolucion ? toLocalDateTimeInput(incidencia.fecha_resolucion) : '';
                setFormData({
                    semaforo_id: incidencia.semaforo_id || '',
                    semaforo_codigo: incidencia.semaforo_codigo || '',
                    descripcion: incidencia.descripcion || '',
                    clasificacion_id: incidencia.clasificacion_id || '',
                    clasificacion_nombre: incidencia.clasificacion_nombre || '',
                    fecha_incidente: fechaIncidente,
                    fecha_resolucion: fechaResolucion,
                    estado: incidencia.estado || 'Pendiente',
                    tipo_horas: incidencia.tipo_horas || ''
                });
                // If editing, check if descripcion matches a predefined one
                const matchesPredefined = descripciones.some(d => d.texto === incidencia.descripcion);
                setDescripcionMode(matchesPredefined ? 'predefinida' : 'otro');
            } else {
                setFormData({
                    semaforo_id: '',
                    semaforo_codigo: '',
                    descripcion: '',
                    clasificacion_id: '',
                    clasificacion_nombre: '',
                    fecha_incidente: toLocalDateTimeInput(null),
                    fecha_resolucion: '',
                    estado: 'Pendiente',
                    tipo_horas: ''
                });
                setDescripcionMode('predefinida');
            }
    }, [incidencia, open]);

    const handleSemaforoChange = (semaforoId) => {
        const selectedSemaforo = semaforos.find(s => s.id === semaforoId);
        setFormData({
            ...formData,
            semaforo_id: semaforoId,
            semaforo_codigo: selectedSemaforo?.codigo || ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-slate-800">
                        {incidencia ? 'Editar Incidencia' : 'Nueva Incidencia'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3 mt-2">
                    <div className="space-y-2">
                        <Label className="text-slate-700">Semáforo *</Label>
                        <Popover open={openCombo} onOpenChange={setOpenCombo}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombo}
                                    className="w-full justify-between h-9"
                                >
                                    {formData.semaforo_id
                                        ? semaforos.find((sem) => sem.id === formData.semaforo_id)?.codigo
                                        : "Buscar semáforo..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Buscar semáforo..." />
                                    <CommandEmpty>No se encontró el semáforo</CommandEmpty>
                                    <CommandGroup className="max-h-64 overflow-auto">
                                        {semaforos.map((sem) => (
                                            <CommandItem
                                                key={sem.id}
                                                value={`${sem.codigo} ${sem.direccion}`}
                                                onSelect={() => {
                                                    handleSemaforoChange(sem.id);
                                                    setOpenCombo(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        formData.semaforo_id === sem.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{sem.codigo}</span>
                                                    <span className="text-xs text-slate-500">{sem.direccion}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-700">Descripción *</Label>
                        {descripciones.length > 0 && (
                            <div className="flex gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => { setDescripcionMode('predefinida'); setFormData({...formData, descripcion: ''}); }}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                                        descripcionMode === 'predefinida'
                                            ? "bg-amber-500 text-white border-amber-500"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                                    )}
                                >
                                    Predefinida
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setDescripcionMode('otro'); setFormData({...formData, descripcion: ''}); }}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                                        descripcionMode === 'otro'
                                            ? "bg-amber-500 text-white border-amber-500"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                                    )}
                                >
                                    Otro (personalizado)
                                </button>
                            </div>
                        )}
                        {descripcionMode === 'predefinida' && descripciones.length > 0 ? (
                            <Select
                                value={formData.descripcion}
                                onValueChange={(value) => setFormData({...formData, descripcion: value})}
                                required
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecciona una descripción..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {descripciones.map(d => (
                                        <SelectItem key={d.id} value={d.texto}>{d.titulo}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Textarea
                                id="descripcion"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                                placeholder="Describe la incidencia..."
                                required
                                rows={3}
                            />
                        )}
                    </div>

                    {/* Clasificación de incidencia */}
                    {clasificaciones.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-slate-700">Clasificación de incidencia</Label>
                            <Select
                                value={formData.clasificacion_id}
                                onValueChange={(value) => {
                                    const found = clasificaciones.find(c => c.id === value);
                                    setFormData({ ...formData, clasificacion_id: value, clasificacion_nombre: found?.nombre || '' });
                                }}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecciona una clasificación..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clasificaciones.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="fecha_incidente" className="text-slate-700">Fecha y Hora *</Label>
                        <Input
                            id="fecha_incidente"
                            type="datetime-local"
                            value={formData.fecha_incidente}
                            onChange={(e) => setFormData({...formData, fecha_incidente: e.target.value})}
                            required
                            className="h-9"
                        />
                    </div>

                    {formData.estado === 'Resuelto' && (
                        <div className="space-y-2">
                            <Label htmlFor="fecha_resolucion" className="text-slate-700">Fecha de Resolución</Label>
                            <Input
                                id="fecha_resolucion"
                                type="datetime-local"
                                value={formData.fecha_resolucion}
                                onChange={(e) => setFormData({...formData, fecha_resolucion: e.target.value})}
                                className="h-9"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-slate-700">Tipo de Horas</Label>
                        <Select
                            value={formData.tipo_horas}
                            onValueChange={(value) => setFormData({...formData, tipo_horas: value})}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecciona tipo de horas..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Ordinarias">Horas Ordinarias</SelectItem>
                                <SelectItem value="Extraordinarias">Horas Extraordinarias</SelectItem>
                                <SelectItem value="Festivas">Horas Festivas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-700">Estado *</Label>
                        <Select 
                            value={formData.estado} 
                            onValueChange={(value) => setFormData({...formData, estado: value})}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="Resuelto">Resuelto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-3 pt-3 sticky bottom-0 bg-white">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-9">
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="flex-1 h-9 bg-amber-500 hover:bg-amber-600"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (incidencia ? 'Actualizar' : 'Guardar')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}