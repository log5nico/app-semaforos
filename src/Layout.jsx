import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { TrafficCone, AlertTriangle, CheckCircle2, FileText, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Incidencias', label: 'Incidencias', icon: AlertTriangle, accent: 'text-amber-500', activeBg: 'bg-amber-50', activeText: 'text-amber-600' },
    { name: 'Resueltos', label: 'Resueltos', icon: CheckCircle2, accent: 'text-emerald-500', activeBg: 'bg-emerald-50', activeText: 'text-emerald-600' },
    { name: 'Semaforos', label: 'Semáforos', icon: TrafficCone, accent: 'text-blue-500', activeBg: 'bg-blue-50', activeText: 'text-blue-600' },
    { name: 'Mantenimiento', label: 'Manto.', icon: Wrench, accent: 'text-green-500', activeBg: 'bg-green-50', activeText: 'text-green-600' },
    { name: 'Descripciones', label: 'Config', icon: FileText, accent: 'text-violet-500', activeBg: 'bg-violet-50', activeText: 'text-violet-600' }
];

export default function Layout({ children, currentPageName }) {

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation */}
            <header className="bg-white/95 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-amber-400 to-red-400 flex items-center justify-center shadow-md">
                                <TrafficCone className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <span className="font-bold text-slate-800 text-sm tracking-tight">SemaforoManager</span>
                                <p className="text-xs text-slate-400 hidden sm:block">Gestión de Mantenimiento</p>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map(item => {
                                const isActive = currentPageName === item.name;
                                return (
                                    <Link key={item.name} to={createPageUrl(item.name)}>
                                        <div className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                                            isActive
                                                ? `${item.activeBg} ${item.activeText}`
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        )}>
                                            <item.icon className={cn('w-4 h-4', isActive ? item.accent : '')} />
                                            {item.label}
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-100 shadow-lg">
                <div className="grid grid-cols-5 h-16">
                    {navItems.map(item => {
                        const isActive = currentPageName === item.name;
                        return (
                            <Link key={item.name} to={createPageUrl(item.name)} className="flex flex-col items-center justify-center gap-1 transition-all">
                                <div className={cn(
                                    'flex flex-col items-center justify-center w-12 h-10 rounded-xl transition-all',
                                    isActive ? `${item.activeBg}` : ''
                                )}>
                                    <item.icon className={cn('w-5 h-5', isActive ? item.accent : 'text-slate-400')} />
                                </div>
                                <span className={cn('text-xs font-medium', isActive ? item.activeText : 'text-slate-400')}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}