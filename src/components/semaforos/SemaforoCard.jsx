import React, { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Image as ImageIcon, Pencil, Trash2, ExternalLink } from "lucide-react";

const SemaforoCard = memo(function SemaforoCard({ semaforo, onEdit, onDelete }) {
  const handleNombreClick = (e) => {
    e.stopPropagation();
    if (semaforo.enlace_maps) {
      window.open(semaforo.enlace_maps, '_blank', 'noopener,noreferrer');
    }
  };

  const handleImagenClick = (e) => {
    e.stopPropagation();
    if (semaforo.enlace_imagen) {
      window.open(semaforo.enlace_imagen, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden">

            <CardContent className="p-0">
                <div className="flex">
                    {/* Traffic Light Indicator */}
                    <div className="bg-gradient-to-b opacity-100 rounded w-2 from-emerald-500 via-amber-400 to-red-500 h-60" />
                    
                    <div className="px-5 py-5 flex-1 h-full\n">
                        <div className="flex items-start justify-between">
                            <div className="flex-1\n">
                                <h3
                  className={`font-semibold text-lg text-slate-800 mb-1 ${semaforo.enlace_maps ? 'cursor-pointer hover:text-emerald-600 hover:underline' : ''}`}
                  onClick={handleNombreClick}>
                  
                                    {semaforo.codigo}
                                </h3>
                                <div className="flex items-center gap-2 text-slate-600 text-sm mb-3">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    <span>{semaforo.direccion}</span>
                                </div>
                                
                                {semaforo.enlace_imagen &&
                <button
                  className="inline-flex items-center gap-2 mt-3 text-emerald-600 text-sm font-medium cursor-pointer hover:text-emerald-700 transition-colors"