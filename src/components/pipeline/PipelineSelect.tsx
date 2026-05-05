import React from 'react';

interface Pipeline {
  id: string;
  nome: string;
}

interface PipelineSelectProps {
  value: string;
  pipelines: Pipeline[];
  onChange: (value: string) => void;
  className?: string;
}

export const PipelineSelect: React.FC<PipelineSelectProps> = ({
  value,
  pipelines,
  onChange,
  className = ''
}) => {
  const currentPipeline = pipelines.find(p => p.id === value);
  const otherPipelines = pipelines.filter(p => p.id !== value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#000dff]/20 ${className}`}
    >
      <option value={currentPipeline?.id || ''}>
        {currentPipeline?.nome || 'Selecione o Pipeline'}
      </option>
      {otherPipelines.map((pipeline) => (
        <option key={pipeline.id} value={pipeline.id}>
          {pipeline.nome}
        </option>
      ))}
    </select>
  );
};

export default PipelineSelect;
