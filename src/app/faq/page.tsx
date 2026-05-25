'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  HelpCircle, 
  Edit, 
  Trash2, 
  X,
  BookOpen
} from 'lucide-react';

const CATEGORIES = [
  { id: 'horarios', name: 'Horários de Funcionamento' },
  { id: 'precos', name: 'Preços e Planos' },
  { id: 'localizacao', name: 'Localização / Endereço' },
  { id: 'experimental', name: 'Aulas / Consultas Experimentais' },
  { id: 'geral', name: 'Dúvidas Gerais' },
];

export default function FaqManager() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any | null>(null);

  // Form Fields
  const [formCategory, setFormCategory] = useState('geral');
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswerShort, setFormAnswerShort] = useState('');
  const [formAnswerComplete, setFormAnswerComplete] = useState('');
  const [formEscalate, setFormEscalate] = useState('');

  const loadFaqs = async () => {
    try {
      const res = await fetch('/api/faqs');
      const data = await res.json();
      if (Array.isArray(data)) {
        setFaqs(data);
      }
    } catch (e) {
      console.error('Erro ao buscar FAQs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  // Abrir Modal para Criar
  const handleOpenCreate = () => {
    setEditingFaq(null);
    setFormCategory('geral');
    setFormQuestion('');
    setFormAnswerShort('');
    setFormAnswerComplete('');
    setFormEscalate('');
    setModalOpen(true);
  };

  // Abrir Modal para Editar
  const handleOpenEdit = (faq: any) => {
    setEditingFaq(faq);
    setFormCategory(faq.categoria || 'geral');
    setFormQuestion(faq.pergunta || '');
    setFormAnswerShort(faq.respostaCurta || '');
    setFormAnswerComplete(faq.respostaCompleta || '');
    setFormEscalate(faq.escalarHumanoQuando || '');
    setModalOpen(true);
  };

  // Salvar FAQ (Criar ou Editar)
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswerShort.trim()) return;

    try {
      const method = editingFaq ? 'PUT' : 'POST';
      const body = {
        categoria: formCategory,
        pergunta: formQuestion,
        respostaCurta: formAnswerShort,
        respostaCompleta: formAnswerComplete,
        escalarHumanoQuando: formEscalate,
        ...(editingFaq ? { id: editingFaq.id } : {}),
      };

      const res = await fetch('/api/faqs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        loadFaqs();
      }
    } catch (e) {
      console.error('Erro ao salvar FAQ:', e);
    }
  };

  // Excluir FAQ
  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta FAQ? Esta ação não pode ser desfeita.')) return;

    try {
      const res = await fetch(`/api/faqs?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadFaqs();
      }
    } catch (e) {
      console.error('Erro ao excluir FAQ:', e);
    }
  };

  // Filtrar FAQs
  const filteredFaqs = faqs.filter((f) => {
    const search = searchQuery.toLowerCase();
    const q = f.pergunta?.toLowerCase() || '';
    const a = f.respostaCurta?.toLowerCase() || '';
    return q.includes(search) || a.includes(search);
  });

  if (loading) {
    return (
      <div className="faq-loading">
        <div className="spinner"></div>
        <p>Carregando Base de Conhecimento Atendly...</p>
      </div>
    );
  }

  return (
    <div className="faq-view">
      {/* Controles de Busca e Criação */}
      <div className="faq-controls glass-panel">
        <div className="search-box">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por pergunta ou resposta na base..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus className="btn-icon" />
          <span>Nova Pergunta FAQ</span>
        </button>
      </div>

      {/* Lista de FAQs */}
      <div className="faq-list">
        {filteredFaqs.length === 0 ? (
          <div className="faq-empty glass-panel">
            <BookOpen className="empty-icon" />
            <p>Nenhuma FAQ cadastrada na base de conhecimento.</p>
            <button className="btn btn-secondary btn-sm" onClick={handleOpenCreate}>Criar Primeira FAQ</button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const catName = CATEGORIES.find((c) => c.id === faq.categoria)?.name || 'Outros';
            return (
              <div key={faq.id} className="faq-card glass-panel">
                <div className="faq-card-header">
                  <span className="faq-category-tag">{catName}</span>
                  <div className="faq-card-actions">
                    <button className="icon-btn edit" onClick={() => handleOpenEdit(faq)} title="Editar">
                      <Edit />
                    </button>
                    <button className="icon-btn delete" onClick={() => handleDeleteFaq(faq.id)} title="Excluir">
                      <Trash2 />
                    </button>
                  </div>
                </div>
                <div className="faq-card-content">
                  <h4>{faq.pergunta}</h4>
                  <p>{faq.respostaCurta}</p>
                  {faq.escalarHumanoQuando && (
                    <div className="faq-escalation-alert">
                      <strong>Escalar quando:</strong> {faq.escalarHumanoQuando}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Criação / Edição */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingFaq ? 'Editar Pergunta FAQ' : 'Nova Pergunta FAQ'}</h3>
              <button className="close-btn" onClick={() => setModalOpen(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSaveFaq}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Categoria</label>
                  <select 
                    value={formCategory} 
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Pergunta Principal</label>
                  <input 
                    type="text" 
                    value={formQuestion} 
                    onChange={(e) => setFormQuestion(e.target.value)}
                    placeholder="Ex: Como posso agendar uma visita?"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Resposta Curta (Ideal para WhatsApp - Máx 300 chars)</label>
                  <textarea 
                    value={formAnswerShort} 
                    onChange={(e) => setFormAnswerShort(e.target.value)}
                    placeholder="Escreva a resposta direta e amigável que o bot vai disparar no WhatsApp..."
                    maxLength={350}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Resposta Completa (Opcional - Para Email/Site)</label>
                  <textarea 
                    value={formAnswerComplete} 
                    onChange={(e) => setFormAnswerComplete(e.target.value)}
                    placeholder="Escreva a resposta detalhada e estendida se necessário..."
                  />
                </div>

                <div className="form-group">
                  <label>Escalar Humano Quando (Opcional - Instrução ao Bot)</label>
                  <input 
                    type="text" 
                    value={formEscalate} 
                    onChange={(e) => setFormEscalate(e.target.value)}
                    placeholder="Ex: Se o cliente pedir desconto adicional ou contestar preços"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingFaq ? 'Salvar Alterações' : 'Adicionar Pergunta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Estilos específicos das FAQs */}
      <style jsx>{`
        .faq-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .faq-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          gap: 16px;
        }

        .faq-controls {
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .faq-controls .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: hsl(var(--bg-tertiary) / 0.5);
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          width: 320px;
        }

        .faq-controls .search-icon {
          width: 16px;
          height: 16px;
          color: hsl(var(--text-muted));
        }

        .faq-controls .search-box input {
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 0.9rem;
          width: 100%;
        }

        .btn-icon {
          width: 16px;
          height: 16px;
        }

        /* Lista de cards FAQ */
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-empty {
          padding: 48px;
          text-align: center;
          color: hsl(var(--text-muted));
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          color: hsl(var(--border-light));
        }

        .faq-card {
          padding: 20px;
          background: hsl(var(--bg-secondary) / 0.3);
          border: 1px solid hsl(var(--border) / 0.8);
          border-radius: var(--radius-md);
        }

        .faq-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .faq-category-tag {
          font-size: 0.75rem;
          font-weight: 600;
          color: hsl(var(--primary));
          background: hsl(var(--primary) / 0.1);
          padding: 4px 10px;
          border-radius: var(--radius-full);
        }

        .faq-card-actions {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: hsl(var(--text-muted));
          padding: 6px;
          border-radius: var(--radius-sm);
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }

        .icon-btn :global(svg) {
          width: 16px;
          height: 16px;
        }

        .icon-btn.edit:hover {
          color: white;
          background: hsl(var(--bg-accent));
        }

        .icon-btn.delete:hover {
          color: hsl(var(--accent-red));
          background: hsl(var(--accent-red) / 0.1);
        }

        .faq-card-content h4 {
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: white;
        }

        .faq-card-content p {
          font-size: 0.95rem;
          color: hsl(var(--text-secondary));
          line-height: 1.4;
        }

        .faq-escalation-alert {
          margin-top: 12px;
          font-size: 0.8rem;
          color: hsl(var(--accent-yellow));
          background: hsl(var(--accent-yellow) / 0.05);
          border: 1px solid hsl(var(--accent-yellow) / 0.1);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          align-self: flex-start;
          display: inline-block;
        }

        /* Modal styling */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .modal-content {
          width: 520px;
          max-width: 90%;
          background: hsl(var(--bg-secondary));
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid hsl(var(--border));
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          cursor: pointer;
        }

        .modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          font-weight: 600;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          background: hsl(var(--bg-tertiary) / 0.5);
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-sm);
          color: white;
          padding: 10px 14px;
          outline: none;
          font-size: 0.95rem;
        }

        .form-group textarea {
          min-height: 100px;
          resize: none;
          font-family: inherit;
        }

        .form-actions {
          padding: 16px 24px;
          border-top: 1px solid hsl(var(--border));
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .btn-sm {
          padding: 6px 12px;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
