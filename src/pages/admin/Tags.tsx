// FINQZ PRO - Tags Page
import React, { useState } from "react";
import { Zap, Edit, Trash2 } from "lucide-react";
import { TAGS_SISTEMA, listarTags, criarTag, editarTag, excluirTag, Tag } from "../../config/tags";
import { Button, Input } from "../../components/ui";
import { PageHeader } from "../../components/layout/PageHeader";

export const TagsPage: React.FC = () => {
  const [tagsList, setTagsList] = useState<Tag[]>(listarTags());
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagForm, setTagForm] = useState({ nome: "", cor: "#ef4444" });
  const [tagError, setTagError] = useState("");

  const handleCriarTag = () => {
    try {
      setTagError("");
      const nova = criarTag(tagForm);
      setTagsList(listarTags());
      setTagForm({ nome: "", cor: "#ef4444" });
    } catch (err: any) {
      setTagError(err.message);
    }
  };

  const handleEditarTag = (tag: Tag) => {
    setEditingTag(tag);
    setTagForm({ nome: tag.nome, cor: tag.cor });
    setTagError("");
  };

  const handleSalvarTag = () => {
    if (!editingTag) return;
    try {
      setTagError("");
      editarTag(editingTag.id, tagForm);
      setTagsList(listarTags());
      setEditingTag(null);
      setTagForm({ nome: "", cor: "#ef4444" });
    } catch (err: any) {
      setTagError(err.message);
    }
  };

  const handleExcluirTag = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta tag?")) {
      excluirTag(id);
      setTagsList(listarTags());
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tags"
        onRefresh={() => setTagsList(listarTags())}
        onImport={() => alert('Funcionalidade de importação em desenvolvimento')}
        importLabel="Importar"
        onExport={() => {
          const blob = new Blob([JSON.stringify(tagsList, null, 2)], { type: 'application/json' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `tags_${new Date().toISOString().split('T')[0]}.json`;
          link.click();
        }}
        exportLabel="Exportar"
        exportData={tagsList}
        exportColumns={[{ key: 'nome', label: 'Nome' }, { key: 'cor', label: 'Cor' }]}
        exportFilename="tags"
      />
      
      <div className="finqz-card p-4 sm:p-5">
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Gerenciar tags</h3>
          
          {/* Formulário para criar/editar tag */}
          <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] p-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nome da Tag</label>
                <Input
                  value={tagForm.nome}
                  onChange={(e) => setTagForm({ ...tagForm, nome: e.target.value })}
                  placeholder="Ex: Quente, Frio, Prioridade..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Cor</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tagForm.cor}
                    onChange={(e) => setTagForm({ ...tagForm, cor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                </div>
              </div>
              <div>
                {editingTag ? (
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { setEditingTag(null); setTagForm({ nome: "", cor: "#ef4444" }); }}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSalvarTag}>
                      Salvar
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleCriarTag}>
                    + Nova Tag
                  </Button>
                )}
              </div>
            </div>
            {tagError && (
              <p className="text-sm text-red-500">{tagError}</p>
            )}
          </div>
          
          {/* Lista de tags */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tagsList.map((tag) => (
              <div 
                key={tag.id} 
                className="flex items-center justify-between rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] p-3 transition-colors hover:bg-[var(--bg-surface-hover)]"
              >
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: tag.cor }}
                  />
                  <span className="font-medium text-[var(--text-primary)] truncate">{tag.nome}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleEditarTag(tag)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface-hover)] rounded transition-colors"
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleExcluirTag(tag.id)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {tagsList.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Nenhuma tag encontrada. Crie sua primeira tag acima.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagsPage;
