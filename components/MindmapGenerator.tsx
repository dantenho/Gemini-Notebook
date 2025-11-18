import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { CheckIcon } from '../constants';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#3b82f6',
    primaryTextColor: '#fff',
    primaryBorderColor: '#1e40af',
    lineColor: '#60a5fa',
    secondaryColor: '#6366f1',
    tertiaryColor: '#8b5cf6',
    background: '#18181b',
    mainBkg: '#27272a',
    secondBkg: '#3f3f46',
    textColor: '#e4e4e7',
    fontSize: '14px',
  }
});

type DiagramType = 'flowchart' | 'mindmap' | 'sequence' | 'class' | 'state' | 'er' | 'gantt';

interface MindmapGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onInsert: (mermaidCode: string) => void;
}

const diagramTypes: { type: DiagramType; name: string; description: string; template: string }[] = [
  {
    type: 'flowchart',
    name: 'Fluxograma',
    description: 'Diagrama de fluxo de processo',
    template: `flowchart TD
    A[Início] --> B{Decisão}
    B -->|Sim| C[Processo 1]
    B -->|Não| D[Processo 2]
    C --> E[Fim]
    D --> E`
  },
  {
    type: 'mindmap',
    name: 'Mapa Mental',
    description: 'Estrutura hierárquica de ideias',
    template: `mindmap
  root((Ideia Central))
    Tópico 1
      Subtópico 1.1
      Subtópico 1.2
    Tópico 2
      Subtópico 2.1
      Subtópico 2.2
    Tópico 3`
  },
  {
    type: 'sequence',
    name: 'Diagrama de Sequência',
    description: 'Interações entre objetos',
    template: `sequenceDiagram
    participant A as Usuário
    participant B as Sistema
    A->>B: Solicita dados
    B->>B: Processa
    B->>A: Retorna resultado`
  },
  {
    type: 'class',
    name: 'Diagrama de Classes',
    description: 'Estrutura de classes',
    template: `classDiagram
    class Animal {
        +String nome
        +int idade
        +fazerSom()
    }
    class Cachorro {
        +latir()
    }
    Animal <|-- Cachorro`
  },
  {
    type: 'state',
    name: 'Diagrama de Estados',
    description: 'Estados e transições',
    template: `stateDiagram-v2
    [*] --> Inativo
    Inativo --> Ativo: iniciar
    Ativo --> Pausado: pausar
    Pausado --> Ativo: retomar
    Ativo --> [*]: finalizar`
  },
  {
    type: 'er',
    name: 'Diagrama ER',
    description: 'Entidade-relacionamento',
    template: `erDiagram
    CLIENTE ||--o{ PEDIDO : faz
    PEDIDO ||--|{ ITEM : contém
    PRODUTO ||--o{ ITEM : "está em"`
  },
  {
    type: 'gantt',
    name: 'Gráfico de Gantt',
    description: 'Cronograma de projeto',
    template: `gantt
    title Cronograma do Projeto
    dateFormat  YYYY-MM-DD
    section Fase 1
    Tarefa 1      :a1, 2024-01-01, 30d
    Tarefa 2      :after a1, 20d
    section Fase 2
    Tarefa 3      :2024-02-01, 25d`
  }
];

export const MindmapGenerator: React.FC<MindmapGeneratorProps> = ({ isOpen, onClose, content, onInsert }) => {
  const [selectedType, setSelectedType] = useState<DiagramType | null>(null);
  const [mermaidCode, setMermaidCode] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedType) {
      const template = diagramTypes.find(d => d.type === selectedType)?.template || '';
      setMermaidCode(template);
    }
  }, [selectedType]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidCode || !previewRef.current) return;

      try {
        setError('');
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        setPreview(svg);
      } catch (err) {
        setError(`Erro ao renderizar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        setPreview('');
      }
    };

    const debounceTimer = setTimeout(renderDiagram, 500);
    return () => clearTimeout(debounceTimer);
  }, [mermaidCode]);

  const handleInsert = () => {
    if (mermaidCode) {
      onInsert(mermaidCode);
      onClose();
    }
  };

  const handleBack = () => {
    setSelectedType(null);
    setMermaidCode('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-zinc-800 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col border border-zinc-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            {selectedType && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-zinc-700 rounded-md transition-colors"
              >
                ←
              </button>
            )}
            <h2 className="text-xl font-bold text-zinc-100">
              {selectedType ? 'Criar Diagrama' : 'Gerador de Mindmap e Diagramas'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-700 rounded-md transition-colors text-zinc-400 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {!selectedType ? (
            // Diagram type selection
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {diagramTypes.map((diagram) => (
                <button
                  key={diagram.type}
                  onClick={() => setSelectedType(diagram.type)}
                  className="p-6 bg-zinc-900/50 border border-zinc-700 rounded-lg hover:bg-zinc-700/50 hover:border-blue-500 transition-all text-left group"
                >
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-blue-400 transition-colors">
                    {diagram.name}
                  </h3>
                  <p className="text-sm text-zinc-400">{diagram.description}</p>
                  <div className="mt-4 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Clique para começar →
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Editor and preview
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* Code editor */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Código Mermaid
                  </label>
                  <a
                    href="https://mermaid.js.org/intro/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Documentação →
                  </a>
                </div>
                <textarea
                  value={mermaidCode}
                  onChange={(e) => setMermaidCode(e.target.value)}
                  className="flex-1 bg-zinc-900 text-zinc-300 font-mono text-sm p-4 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Digite o código Mermaid aqui..."
                  spellCheck={false}
                />
                {error && (
                  <div className="mt-2 p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-400">
                    {error}
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-zinc-300 mb-2">
                  Pré-visualização
                </label>
                <div
                  ref={previewRef}
                  className="flex-1 bg-zinc-900 rounded-lg border border-zinc-700 p-4 overflow-auto flex items-center justify-center"
                >
                  {preview ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: preview }}
                      className="mermaid-preview"
                    />
                  ) : (
                    <div className="text-zinc-500 text-center">
                      {error ? 'Corrija os erros no código' : 'Aguardando código...'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedType && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleInsert}
              disabled={!mermaidCode || !!error}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              Inserir Diagrama
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MindmapGenerator;
