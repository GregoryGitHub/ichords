import React from 'react';

interface InfoCardProps {
  title: string;
  description: string;
  items?: { label: string; value: string }[];
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, description, items }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-5 border-l-4 border-brand-500 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-300 text-sm leading-relaxed mb-4">{description}</p>
      
      {items && items.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, idx) => (
            <div key={idx} className="bg-slate-900/50 p-2 rounded flex flex-col">
              <span className="text-xs text-slate-500 uppercase">{item.label}</span>
              <span className="text-sm font-semibold text-brand-100">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
