'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Smartphone, 
  Clock, 
  DollarSign, 
  Calendar,
  X,
  CheckCircle,
  TrendingUp,
  User
} from 'lucide-react';
import { Instagram } from '@/components/icons';

const STAGES = [
  { id: 'novo', name: 'Novo Lead', color: 'blue' },
  { id: 'em_qualificacao', name: 'Qualificando', color: 'yellow' },
  { id: 'qualificado', name: 'Qualificado', color: 'emerald' },
  { id: 'proposta', name: 'Proposta Enviada', color: 'purple' },
  { id: 'cliente', name: 'Cliente Ativo', color: 'emerald' },
  { id: 'perdido', name: 'Perdido', color: 'red' },
];

export default function LeadsCRM() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal de Detalhes
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Campos para Edição no Modal
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editInteresse, setEditInteresse] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editValor, setEditValor] = useState<number>(0);
  const [editObs, setEditObs] = useState('');

  const loadLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
      }
    } catch (e) {
      console.error('Erro ao ler leads:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // Abrir Modal de Detalhes
  const openModal = (lead: any) => {
    setSelectedLead(lead);
    setEditName(lead.nome || '');
    setEditEmail(lead.email || '');
    setEditTelefone(lead.telefone || '');
    setEditInteresse(lead.interesse || '');
    setEditStatus(lead.status || 'novo');
    setEditValor(lead.valorPotencial || 0);
    setEditObs(lead.observacoes || '');
    setIsEditing(false);
  };

  // Salvar Edição do Lead
  const handleSaveLead = async () => {
    if (!selectedLead) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          nome: editName,
          email: editEmail,
          telefone: editTelefone,
          interesse: editInteresse,
          status: editStatus,
          valorPotencial: Number(editValor),
          observacoes: editObs,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedLead({
          ...selectedLead,
          nome: editName,
          email: editEmail,
          telefone: editTelefone,
          interesse: editInteresse,
          status: editStatus,
          valorPotencial: editValor,
          observacoes: editObs,
        });
        loadLeads();
        setIsEditing(false);
      }
    } catch (e) {
      console.error('Erro ao atualizar lead:', e);
    }
  };

  // Mover lead entre colunas diretamente arrastando ou alterando
  const moveLead = async (leadId: string, newStage: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          status: newStage,
        }),
      });
      if (res.ok) {
        loadLeads();
      }
    } catch (e) {
      console.error('Erro ao mover lead:', e);
    }
  };

  // Filtrar leads
  const filteredLeads = leads.filter((l) => {
    const search = searchQuery.toLowerCase();
    const nome = l.nome?.toLowerCase() || '';
    const interesse = l.interesse?.toLowerCase() || '';
    return nome.includes(search) || interesse.includes(search);
  });

  if (loading) {
    return (
      <div className="crm-loading">
        <div className="spinner"></div>
        <p>Acessando painel CRM do Atendly...</p>
      </div>
    );
  }

  return (
    <div className="crm-view">
      {/* Controles de Filtros */}
      <div className="crm-filters glass-panel">
        <div className="search-box">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou interesse..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="pipeline-stats">
          <span>Total: <strong>{leads.length} leads</strong></span>
          <span>•</span>
          <span>Valor Estimado Pipeline: <strong>R$ {leads.reduce((acc, l) => acc + (l.valorPotencial || 0), 0).toFixed(2)}</strong></span>
        </div>
      </div>

      {/* Quadro Kanban */}
      <div className="kanban-board">
        {STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter((l) => l.status === stage.id);
          return (
            <div key={stage.id} className="kanban-column glass-panel">
              <div className="column-header">
                <div className="header-title">
                  <span className={`dot ${stage.color}`}></span>
                  <h4>{stage.name}</h4>
                </div>
                <span className="column-count">{stageLeads.length}</span>
              </div>

              <div className="column-cards">
                {stageLeads.map((lead) => (
                  <div 
                    key={lead.id} 
                    className="lead-card glass-panel glass-panel-hover"
                    onClick={() => openModal(lead)}
                  >
                    <div className="card-top">
                      <span className="lead-card-name">{lead.nome}</span>
                      {lead.canalOrigem === 'whatsapp' ? (
                        <Smartphone className="card-channel wa" />
                      ) : (
                        <Instagram className="card-channel ig" />
                      )}
                    </div>
                    
                    {lead.interesse && (
                      <div className="card-interest">{lead.interesse}</div>
                    )}

                    <div className="card-meta">
                      <div className="card-score">
                        <span>Score: </span>
                        <strong className={lead.scoreQualificacao >= 70 ? 'high-score' : ''}>
                          {lead.scoreQualificacao}
                        </strong>
                      </div>
                      {lead.valorPotencial && lead.valorPotencial > 0 ? (
                        <span className="card-value">R$ {lead.valorPotencial}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalhes do Lead */}
      {selectedLead && (
        <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalhes do Lead</h3>
              <button className="close-btn" onClick={() => setSelectedLead(null)}>
                <X />
              </button>
            </div>

            <div className="modal-body">
              {isEditing ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Nome Completo</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Telefone</label>
                      <input type="text" value={editTelefone} onChange={(e) => setEditTelefone(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Estágio no Funil</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Interesse</label>
                      <input type="text" value={editInteresse} onChange={(e) => setEditInteresse(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Valor Potencial (R$)</label>
                    <input type="number" value={editValor} onChange={(e) => setEditValor(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Observações / Histórico de Notas</label>
                    <textarea value={editObs} onChange={(e) => setEditObs(e.target.value)} />
                  </div>

                  <div className="form-actions">
                    <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleSaveLead}>Salvar Alterações</button>
                  </div>
                </div>
              ) : (
                <div className="lead-profile">
                  <div className="profile-header">
                    <div className="profile-icon"><User /></div>
                    <div className="profile-info">
                      <h4>{selectedLead.nome}</h4>
                      <p>{selectedLead.email || 'Email não cadastrado'}</p>
                      <p>{selectedLead.telefone || selectedLead.instagramHandle || 'Contato não cadastrado'}</p>
                    </div>
                  </div>

                  <div className="profile-details-grid">
                    <div className="detail-item">
                      <span>Status Funil</span>
                      <strong>{STAGES.find(s => s.id === selectedLead.status)?.name}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Interesse</span>
                      <strong>{selectedLead.interesse || 'Não especificado'}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Score de IA</span>
                      <strong className={selectedLead.scoreQualificacao >= 70 ? 'text-emerald' : ''}>
                        {selectedLead.scoreQualificacao}/100
                      </strong>
                    </div>
                    <div className="detail-item">
                      <span>Canal Origem</span>
                      <span className="capitalize">{selectedLead.canalOrigem}</span>
                    </div>
                    <div className="detail-item">
                      <span>Valor Estimado</span>
                      <strong>R$ {(selectedLead.valorPotencial || 0).toFixed(2)}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Último Contato</span>
                      <span>{new Date(selectedLead.ultimoContatoEm).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="detail-notes">
                    <h5>Notas do Atendente</h5>
                    <p>{selectedLead.observacoes || 'Nenhuma observação inserida ainda.'}</p>
                  </div>

                  <div className="profile-actions">
                    <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Editar Ficha</button>
                    <div className="move-actions">
                      <span>Mover para:</span>
                      <div className="move-buttons">
                        {STAGES.filter(s => s.id !== selectedLead.status).map(s => (
                          <button 
                            key={s.id} 
                            className="btn btn-secondary btn-sm"
                            onClick={() => { moveLead(selectedLead.id, s.id); setSelectedLead(null); }}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estilos específicos do CRM */}
      <style jsx>{`
        .crm-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
          height: 100%;
        }

        .crm-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          gap: 16px;
        }

        .crm-filters {
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .crm-filters .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: hsl(var(--bg-tertiary) / 0.5);
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          width: 320px;
        }

        .crm-filters .search-icon {
          width: 16px;
          height: 16px;
          color: hsl(var(--text-muted));
        }

        .crm-filters .search-box input {
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 0.9rem;
          width: 100%;
        }

        .pipeline-stats {
          font-size: 0.9rem;
          color: hsl(var(--text-secondary));
          display: flex;
          gap: 8px;
        }

        .pipeline-stats strong {
          color: white;
        }

        /* Kanban Board */
        .kanban-board {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          overflow-x: auto;
          flex: 1;
          align-items: start;
          padding-bottom: 16px;
          min-height: 550px;
        }

        @media (max-width: 1200px) {
          .kanban-board {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          }
        }

        .kanban-column {
          background: hsl(var(--bg-secondary) / 0.4);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 200px;
          max-height: 580px;
          overflow-y: auto;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid hsl(var(--border));
          padding-bottom: 10px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-title h4 {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .column-count {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          font-weight: 500;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot.blue { background: hsl(var(--accent-blue)); }
        .dot.yellow { background: hsl(var(--accent-yellow)); }
        .dot.emerald { background: hsl(var(--accent-emerald)); }
        .dot.purple { background: hsl(var(--primary)); }
        .dot.red { background: hsl(var(--accent-red)); }

        .column-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .lead-card {
          padding: 14px;
          background: hsl(var(--bg-tertiary) / 0.3);
          border: 1px solid hsl(var(--border) / 0.5);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .lead-card-name {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }

        .card-channel {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .card-channel.wa { color: #25d366; }
        .card-channel.ig { color: #e1306c; }

        .card-interest {
          font-size: 0.75rem;
          color: hsl(var(--text-secondary));
          background: hsl(var(--bg-accent) / 0.5);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          align-self: flex-start;
        }

        .card-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          border-top: 1px solid hsl(var(--border) / 0.3);
          padding-top: 8px;
        }

        .high-score {
          color: hsl(var(--accent-emerald));
        }

        .card-value {
          font-weight: 600;
          color: white;
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
          width: 580px;
          max-width: 90%;
          max-height: 90vh;
          overflow-y: auto;
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

        .close-btn:hover {
          color: white;
        }

        .modal-body {
          padding: 24px;
        }

        /* Edit Form */
        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .form-row .form-group {
          flex: 1;
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
          min-height: 120px;
          resize: none;
          font-family: inherit;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
        }

        /* Lead Profile (View mode) */
        .lead-profile {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .profile-header {
          display: flex;
          gap: 16px;
          align-items: center;
          border-bottom: 1px solid hsl(var(--border) / 0.5);
          padding-bottom: 16px;
        }

        .profile-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: hsl(var(--primary) / 0.2);
          color: hsl(var(--primary));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-info h4 {
          font-size: 1.2rem;
          margin-bottom: 4px;
        }

        .profile-info p {
          font-size: 0.85rem;
          color: hsl(var(--text-secondary));
        }

        .profile-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: hsl(var(--bg-tertiary) / 0.3);
          border: 1px solid hsl(var(--border) / 0.5);
          padding: 12px;
          border-radius: var(--radius-sm);
        }

        .detail-item span {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
        }

        .detail-item strong {
          font-size: 0.95rem;
        }

        .detail-notes {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: hsl(var(--bg-accent) / 0.2);
          border: 1px solid hsl(var(--border) / 0.5);
          padding: 16px;
          border-radius: var(--radius-sm);
        }

        .detail-notes h5 {
          font-size: 0.85rem;
          text-transform: uppercase;
          color: hsl(var(--text-muted));
        }

        .detail-notes p {
          font-size: 0.9rem;
          color: hsl(var(--text-secondary));
          line-height: 1.4;
        }

        .profile-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-top: 1px solid hsl(var(--border) / 0.5);
          padding-top: 16px;
          margin-top: 8px;
        }

        .move-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .move-actions span {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
        }

        .move-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 0.8rem;
        }
        
        .text-emerald { color: hsl(var(--accent-emerald)); }
        .capitalize { text-transform: capitalize; }
      `}</style>
    </div>
  );
}
