import React from 'react';

const Spinner: React.FC<{ className?: string }> = ({ className = 'w-12 h-12 border-4' }) => {
  return (
    <div className={`${className} rounded-full border-slate-700 border-t-violet-500 animate-spin`}></div>
  );
};

export default Spinner;