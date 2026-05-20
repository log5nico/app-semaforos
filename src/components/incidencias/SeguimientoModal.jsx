import { supabase } from '@/lib/supabase'

import React, { useState, useEffect } from 'react';
import ImageLightbox from '../common/ImageLightbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Image as ImageIcon, ExternalLink, Camera, X, Upload } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { compressImage } from './imageCompression';

export default function SeguimientoModal({ open, onClose, incidencia, onSave, isLoading }) {
    const [fotos, setFotos] = useState([]);
    const [newPhotos, setNewPhotos] = useState([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    useEffect(() => {
        if (incidencia) {
            setFotos(incidencia.fotos_seguimiento || []);
            setNewPhotos([]);
        }
    }, [incidencia, open]);

    useEffect(() => {
        return () => {
            newPhotos.forEach(photo => {
                if (photo.preview) URL.revokeObjectURL(photo.preview);
            });
        };
    }, [newPhotos]);

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const photosWithPreview = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        
        setNewPhotos([...newPhotos, ...photosWithPreview]);
        e.target.value = '';
    };

    const handleRemovePhoto = (index, isNew) => {
        if (isNew) {
            const photoToRemove = newPhotos[index];
            if (photoToRemove.preview) URL.revokeObjectURL(photoToRemove.preview);
            setNewPhotos(newPhotos.filter((_, i) => i !== index));
        } else {
            setFotos(fotos.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPhotos.length > 0) {
            setUploadingPhoto(true);
            try {
                const compressPromises = newPhotos.map(photo => compressImage(photo.file));
                const compressedFiles = await Promise.all(compressPromises);
                
                const uploadPromises = compressedFiles.map(file => 
                    db.integrations.Core.UploadFile({ file })
                );
                const results = await Promise.all(uploadPromises);
                const newUrls = results.map(result => result.file_url);
                
                onSave({ 
                    fotos_seguimiento: [...fotos, ...newUrls]
                });
            } catch (error) {
                console.error('Error uploading photos:', error);
                setUploadingPhoto(false);
            }
        } else {
            onSave({ 
                fotos_seguimiento: fotos
            });
        }
    };

    if (!incidencia) return null;

    const estadoConfig = {
        'Pendiente': { badge: 'bg-red-100 text-red-700 border-red-200' },
        'En proceso': { badge: 'bg-amber-100 text-amber-700 border-amber-200' },
        'Resuelto': { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    };

    const config = estadoConfig[incidencia.estado] || estadoConfig['Pendiente'];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-slate-800">
                        Seguimiento de Trabajo
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Info de la incidencia */}
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-700">
                                    {incidencia.semaforo_codigo}
                                </span>
                                <Badge variant="outline" className={`${config.badge} text-xs`}>
                                    {incidencia.estado}
                                </Badge>
                            </div>
                            <span className="text-sm text-slate-500">
                                {format(new Date(incidencia.fecha_incidente), "d MMM yyyy", { locale: es })}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600">{incidencia.descripcion}</p>
                    </div>

                    {/* Formulario de seguimiento */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Fotos del trabajo */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Fotos del trabajo
                            </label>
                            
                            <div className="flex gap-2">
                                <label className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                        disabled={uploadingPhoto}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        disabled={uploadingPhoto}
                                        onClick={(e) => e.currentTarget.previousElementSibling.click()}
                                    >
                                        {uploadingPhoto ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                            <Camera className="w-4 h-4 mr-2" />
                                        )}
                                        Tomar foto
                                    </Button>
                                </label>
                                
                                <label className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                        disabled={uploadingPhoto}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        disabled={uploadingPhoto}
                                        onClick={(e) => e.currentTarget.previousElementSibling.click()}
                                    >
                                        {uploadingPhoto ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                            <Upload className="w-4 h-4 mr-2" />
                                        )}
                                        Subir foto
                                    </Button>
                                </label>
                            </div>

                            {/* Grid de fotos */}
                            {(fotos.length > 0 || newPhotos.length > 0) && (
                                <div className="grid grid-cols-3 gap-2 mt-3">
                                    {fotos.map((url, index) => (
                                        <div key={`saved-${index}`} className="relative group aspect-square">
                                            <img 
                                                src={url} 
                                                alt={`Foto guardada ${index + 1}`}
                                                loading="lazy"
                                                className="w-full h-full object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                             onClick={() => setLightboxIndex(index)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePhoto(index, false)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {newPhotos.map((photo, index) => (
                                        <div key={`new-${index}`} className="relative group aspect-square">
                                            <img 
                                                src={photo.preview} 
                                                alt={`Nueva foto ${index + 1}`}
                                                loading="lazy"
                                                className="w-full h-full object-cover rounded-lg border-2 border-amber-400"
                                            />
                                            <div className="absolute top-1 left-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded">
                                                Nueva
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePhoto(index, true)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <p className="text-xs text-slate-500">
                                Las fotos nuevas se marcan en amarillo y se suben al guardar
                            </p>
                        </div>

                        <div className="flex gap-3 sticky bottom-0 bg-white pt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onClose} 
                                className="flex-1"
                            >
                                Cerrar
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isLoading || uploadingPhoto}
                                className="flex-1 bg-amber-500 hover:bg-amber-600"
                            >
                                {(isLoading || uploadingPhoto) ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        {uploadingPhoto ? 'Subiendo fotos...' : 'Guardando...'}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Guardar {newPhotos.length > 0 && `(${newPhotos.length} nueva${newPhotos.length > 1 ? 's' : ''})`}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                    </div>
                    {lightboxIndex !== null && (
                    <ImageLightbox
                        images={fotos}
                        initialIndex={lightboxIndex}
                        onClose={() => setLightboxIndex(null)}
                    />
                    )}
                    </DialogContent>
                    </Dialog>
    );
}
