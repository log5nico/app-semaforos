import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export default function SemaforoForm({ open, onClose, onSave, semaforo, isLoading }) {
    const [formData, setFormData] = useState({
        codigo: '',
        direccion: '',
        enlace_imagen: '',
        enlace_maps: ''
    });

    useEffect(() => {
        if (semaforo) {
            setFormData({
                codigo: semaforo.codigo || '',
                direccion: semaforo.direccion || '',
                enlace_imagen: semaforo.enlace_imagen || '',
                enlace_maps: semaforo.enlace_maps || ''
            });
        } else {
            setFormData({
                codigo: '',
                direccion: '',
                enlace_imagen: '',
                enlace_maps: ''
            });
        }
    }, [semaforo, open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-slate-800">
                        {semaforo ? 'Editar Semáforo' : 'Nuevo Semáforo'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="codigo" className="text-slate-700">Código / Nombre *</Label>
                        <Input
                            id="codigo"
                            value={formData.codigo}
                            onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                            placeholder="Ej: SEM-001"
                            required
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="direccion" className="text-slate-700">Dirección *</Label>
                        <Input
                            id="direccion"
                            value={formData.direccion}
                            onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                            placeholder="Ej: Av. Principal con Calle 5"
                            required
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="enlace_maps" className="text-slate-700">Enlace de Google Maps</Label>
                        <Input
                            id="enlace_maps"
                            value={formData.enlace_maps}
                            onChange={(e) => setFormData({...formData, enlace_maps: e.target.value})}
                            placeholder="https://maps.google.com/..."
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="enlace_imagen" className="text-slate-700">Enlace de la imagen (Google Drive)</Label>
                        <Input
                            id="enlace_imagen"
                            value={formData.enlace_imagen}
                            onChange={(e) => setFormData({...formData, enlace_imagen: e.target.value})}
                            placeholder="https://drive.google.com/..."
                            className="h-11"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (semaforo ? 'Actualizar' : 'Guardar')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}