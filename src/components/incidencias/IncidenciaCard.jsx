import React, { useState, memo } from 'react';
import ImageLightbox from '../common/ImageLightbox';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, AlertTriangle, Pencil, Trash2, TrafficCone, Image as ImageIcon, ExternalLink, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportIncidenciaToDocx } from './ExportDocx';

const estadoConfig = {
    'Pendiente': { 
        bg: 'bg-white', 
        border: 'border-red-200', 
        badge: 'bg-red-100 text-red-700 border-red-200',
        indicator: 'bg-red-500',
        label: 'Pendiente'
    },
    'Resuelto': { 
        bg: 'bg-white', 
        border: 'border-emerald-200', 
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        indicator: 'bg-emerald-500',
        label: 'Resuelto'
    }
};

const IncidenciaCard = memo(function IncidenciaCard({ incidencia, onEdit, onDelete, onStatusChange, onOpenSeguimiento, showActions = true, showExport = false }) {
    const config = estadoConfig[incidencia.estado] || estadoConfig['Pendiente'];
    const [exporting, setExporting] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    const handleExport = async (e) => {
        e.stopPropagation();
        setExporting(true);
        try {
            await exportIncidenciaToDocx(incidencia);
        } catch (error) {
            console.error('Error exportando:', error);
        } finally {
            setExporting(false);
        }
    };

    return (
        <>
            <Card 
                className={`group transition-all duration-200 hover:shadow-md ${config.bg} ${config.border} border rounded-2xl overflow-hidden cursor-pointer`}
                onClick={() => onOpenSeguimiento && onOpenSeguimiento(incidencia)}
            >
                <CardContent className="p-0">
                    <div className="flex">
                        <div className={`w-1 ${config.indicator} rounded-l-2xl`} />

                        <div className="flex-1 min-w-0 p-4 sm:p-5">
                            {/* Top row: semaforo + badge + actions */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <TrafficCone className="w-4 h-4 text-slate-400" />
                                        <span className="font-bold text-slate-800 text-sm">{incidencia.semaforo_codigo}</span>
                                    </div>
                                    {incidencia.clasificacion_nombre && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium border border-violet-100">
                                            {incidencia.clasificacion_nombre}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    {showActions && (
                                        <>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                onClick={(e) => { e.stopPropagation(); onEdit(incidencia); }}
                                                className="h-7 w-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                onClick={(e) => { e.stopPropagation(); onDelete(incidencia); }}
                                                className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </>
                                    )}
                                    {showExport && (
                                        <Button 
                                            size="sm"
                                            onClick={handleExport}
                                            disabled={exporting}
                                            className="bg-emerald-600 hover:bg-emerald-700 h-7 px-3 text-xs rounded-full"
                                        >
                                            {exporting ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <><Download className="w-3 h-3 mr-1" />Exportar</>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-slate-700 text-sm leading-relaxed mb-3 line-clamp-2">
                                {incidencia.descripcion}
                            </p>

                            {/* Dates */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{format(new Date(incidencia.fecha_incidente), "d MMM yyyy, HH:mm", { locale: es })}</span>
                                </div>
                                {incidencia.fecha_resolucion && (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Resuelto: {format(new Date(incidencia.fecha_resolucion), "d MMM yyyy, HH:mm", { locale: es })}</span>
                                    </div>
                                )}
                            </div>

                            {/* CTA hint */}
                            <div className="text-xs text-amber-500 font-medium mb-3">
                                Toca para ver seguimiento de trabajo
                            </div>

                            {/* Photos */}
                            {incidencia.fotos_seguimiento && incidencia.fotos_seguimiento.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-2">Fotos del trabajo ({incidencia.fotos_seguimiento.length})</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {incidencia.fotos_seguimiento.map((url, idx) => (
                                            <img 
                                                key={idx}
                                                src={url} 
                                                alt={`Foto ${idx + 1}`}
                                                loading="lazy"
                                                className="w-full aspect-square object-cover rounded-xl border border-slate-100 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            {lightboxIndex !== null && incidencia.fotos_seguimiento && (
                <ImageLightbox
                    images={incidencia.fotos_seguimiento}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </>
    );
});

export default IncidenciaCard;