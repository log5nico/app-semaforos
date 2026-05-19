import React from 'react';

export default function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">{description}</p>
        </div>
    );
}