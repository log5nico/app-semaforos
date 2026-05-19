const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function ZonaEditModal({ zona, semaforos, onClose, onSaved }) {
    const [nombre, setNombre] = useState(zona?.nombre || '');
    const [selected, setSelected] = useState(new Set(zona?.semaforos_ids || []));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setNombre(zona?.nombre || '');
        setSelected(new Set(zona?.semaforos_ids || []));
    }, [zona]);

    const toggle = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        const data = { nombre, semaforos_ids: [...selected] };
        if (zona?.id) {
            await db.entities.Zona.update(zona.id, data);
        } else {
            await db.entities.Zona.create({ ...data, zona_key: zona.zona_key });
        }
        setSaving(false);
        onSaved();
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Editar zona</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 overflow-y-auto py-2">
                    <div>
                        <Label className="mb-1 block">Nombre de la zona</Label>
                        <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre..." />
                    </div>
                    <div>
                        <Label className="mb-2 block">Semáforos incluidos</Label>
                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                            {semaforos.length === 0 && (
                                <p className="text-sm text-slate-400">No hay semáforos disponibles</p>
                            )}
                            {semaforos.map(s => (
                                <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                                    <Checkbox
                                        checked={selected.has(s.id)}
                                        onCheckedChange={() => toggle(s.id)}
                                    />
                                    <span className="text-sm">{s.codigo} — <span className="text-slate-500">{s.direccion}</span></span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving || !nombre.trim()}>
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}