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
        subtitle="Crie e gerencie tags para classificar seus leads e oportunidades"
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
      
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Gerenciar Tags</h3>
          <p className="text-sm text-gray-500">Crie e gerencie tags para classificar seus leads e oportunidades</p>
          
          {/* Formulário para criar/editar tag */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Tag</label>
                <Input
                  value={tagForm.nome}
                  onChange={(e) => setTagForm({ ...tagForm, nome: e.target.value })}
                  placeholder="Ex: Quente, Frio, Prioridade..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
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
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: tag.cor }}
                  />
                  <span className="font-medium text-gray-900 truncate">{tag.nome}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleEditarTag(tag)}
                    className="p-1.5 text-gray-400 hover:text-[#000dff] hover:bg-gray-100 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleExcluirTag(tag.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {tagsList.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma tag encontrada. Crie sua primeira tag acima.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagsPage;
