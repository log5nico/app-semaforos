import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function ResolucionModal({ open, onClose, onConfirm, isLoading }) {
    const [fechaResolucion, setFechaResolucion] = useState(
        new Date().toISOString().slice(0, 16)
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(fechaResolucion);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-slate-800">
                        Marcar como Resuelto
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fecha_resolucion" className="text-slate-700">
                            Fecha y Hora de Resolución *
                        </Label>
                        <Input
                            id="fecha_resolucion"
                            type="datetime-local"
                            value={fechaResolucion}
                            onChange={(e) => setFechaResolucion(e.target.value)}
                            required
                            className="h-10"
                        />
                        <p className="text-xs text-slate-500">
                            Indica cuándo se completó la resolución de esta incidencia
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button 
                            type="button" 
                            variant="outline"