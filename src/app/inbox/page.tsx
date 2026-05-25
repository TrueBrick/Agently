'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Bot, 
  User, 
  Smartphone, 
  Info, 
  VolumeX, 
  Volume2,
  Calendar,
  Tag,
  CheckCircle
} from 'lucide-react';
import { Instagram } from '@/components/icons';

export default function Inbox() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Polling a cada 3 segundos para dar efeito de tempo real localmente
  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch('/api/conversations');
        const data = await res.json();
        if (Array.isArray(data)) {
          setConversations(data);
          // Setar primeira conversa ativa se nenhuma estiver selecionada
          if (data.length > 0 && !activeConvId) {
            setActiveConvId(data[0].id);
          }
        }
      } catch (e) {
        console.error('Erro ao ler conversas:', e);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
    const interval = setInterval(loadConversations, 3000);
    return () => clearInterval(interval);
  }, [activeConvId]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvId, conversations]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Enviar mensagem manual do atendente
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeConvId || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvId,
          content: typedMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Limpa campo
        setTypedMessage('');
        
        // Atualiza a conversa localmente de imediato
        setConversations(prev => prev.map(c => {
          if (c.id === activeConvId) {
            return {
              ...c,
              status: 'human_required', // humano respondeu -> bot pausado
              messages: [...(c.messages || []), data.message],
              lastMessageAt: new Date().toISOString()
            };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error('Erro ao enviar mensagem manual:', e);
    } finally {
      setSending(false);
    }
  };

  // Alternar pausa/ativação do bot (Handoff manual)
  const handleToggleBot = async (newStatus: 'open' | 'human_required') => {
    if (!activeConvId) return;

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvId,
          action: 'update_status',
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConversations(prev => prev.map(c => {
          if (c.id === activeConvId) {
            return { ...c, status: newStatus };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error('Erro ao alternar status do bot:', e);
    }
  };

  // Atualizar campo do lead
  const handleUpdateLeadField = async (field: string, value: any) => {
    if (!activeConv?.lead?.id) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: activeConv.lead.id,
          [field]: value,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConversations(prev => prev.map(c => {
          if (c.id === activeConvId) {
            return {
              ...c,
              lead: { ...c.lead, [field]: value }
            };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error('Erro ao salvar campo do lead:', e);
    }
  };

  // Filtrar conversas
  const filteredConversations = conversations.filter((c) => {
    const search = searchQuery.toLowerCase();
    const name = c.lead?.nome?.toLowerCase() || '';
    const phone = c.lead?.telefone || '';
    const handle = c.lead?.instagramHandle?.toLowerCase() || '';
    return name.includes(search) || phone.includes(search) || handle.includes(search);
  });

  if (loading && conversations.length === 0) {
    return (
      <div className="inbox-loading">
        <div className="spinner"></div>
        <p>Acessando Inbox do Atendly...</p>
      </div>
    );
  }

  return (
    <div className="inbox-view glass-panel">
      {/* Sidebar de Chats */}
      <div className="inbox-sidebar">
        <div className="search-box">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar conversa..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="chats-list">
          {filteredConversations.length === 0 ? (
            <p className="no-chats">Nenhuma conversa encontrada.</p>
          ) : (
            filteredConversations.map((c) => {
              const lastMsg = c.messages?.[c.messages.length - 1];
              const isActive = c.id === activeConvId;
              const isHandoff = c.status === 'human_required';

              return (
                <div 
                  key={c.id} 
                  className={`chat-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveConvId(c.id)}
                >
                  <div className="chat-item-header">
                    <span className="chat-name">{c.lead?.nome}</span>
                    <span className="chat-time">
                      {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="chat-item-footer">
                    <p className="chat-preview">{lastMsg ? lastMsg.content : 'Sem mensagens'}</p>
                    <div className="chat-badges">
                      {c.lead?.canalOrigem === 'whatsapp' ? (
                        <Smartphone className="channel-badge wa" />
                      ) : (
                        <Instagram className="channel-badge ig" />
                      )}
                      {isHandoff && <span className="badge badge-danger">Mão Única</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Janela de Chat */}
      <div className="chat-window">
        {activeConv ? (
          <>
            {/* Header do Chat */}
            <div className="chat-header">
              <div className="header-user-info">
                <h3>{activeConv.lead?.nome}</h3>
                <span className="chat-subtitle">
                  {activeConv.lead?.telefone || activeConv.lead?.instagramHandle || 'Canal Desconhecido'}
                </span>
              </div>
              <div className="chat-actions">
                {activeConv.status === 'human_required' ? (
                  <button 
                    onClick={() => handleToggleBot('open')}
                    className="btn btn-secondary text-emerald"
                  >
                    <Volume2 className="action-icon" />
                    <span>Ligar Assistente IA</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => handleToggleBot('human_required')}
                    className="btn btn-danger"
                  >
                    <VolumeX className="action-icon" />
                    <span>Pausar IA / Handoff</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mensagens */}
            <div className="chat-messages">
              {activeConv.messages && activeConv.messages.length > 0 ? (
                activeConv.messages.map((msg: any) => {
                  const isLead = msg.direction === 'in';
                  return (
                    <div key={msg.id} className={`message-bubble ${isLead ? 'incoming' : 'outgoing'}`}>
                      <div className="bubble-content">
                        <p>{msg.content}</p>
                        <div className="bubble-meta">
                          <span>
                            {msg.senderType === 'bot' && <Bot className="sender-indicator" />}
                            {msg.senderType === 'human' && <User className="sender-indicator" />}
                            {msg.senderType === 'bot' ? 'IA' : msg.senderType === 'human' ? 'Atendente' : 'Cliente'}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-chat">Inicie a conversa enviando uma mensagem.</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form className="chat-input-form" onSubmit={handleSendMessage}>
              {activeConv.status !== 'human_required' && (
                <div className="chat-input-alert">
                  <Bot className="alert-bot-icon" />
                  <span>A IA está respondendo essa conversa automaticamente. Ao digitar e enviar, você pausará a IA.</span>
                </div>
              )}
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="Escreva sua mensagem..." 
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  <Send className="send-icon" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="empty-window">
            <Bot className="big-bot-icon" />
            <p>Selecione uma conversa para iniciar o atendimento</p>
          </div>
        )}
      </div>

      {/* Inspetor de Leads (Sidebar Direita) */}
      {activeConv && (
        <div className="lead-inspector">
          <div className="inspector-header">
            <Info className="info-icon" />
            <h3>Ficha do Lead</h3>
          </div>

          <div className="inspector-content">
            <div className="field-group">
              <label>Nome do Lead</label>
              <input 
                type="text" 
                value={activeConv.lead?.nome || ''} 
                onChange={(e) => handleUpdateLeadField('nome', e.target.value)}
              />
            </div>

            <div className="field-group">
              <label>Status Funil CRM</label>
              <select 
                value={activeConv.lead?.status || 'novo'} 
                onChange={(e) => handleUpdateLeadField('status', e.target.value)}
              >
                <option value="novo">Novo</option>
                <option value="em_qualificacao">Qualificando</option>
                <option value="qualificado">Qualificado</option>
                <option value="proposta">Proposta Feita</option>
                <option value="cliente">Cliente Ativo</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>

            <div className="field-group">
              <label>Serviço Desejado</label>
              <input 
                type="text" 
                value={activeConv.lead?.interesse || ''} 
                onChange={(e) => handleUpdateLeadField('interesse', e.target.value)}
                placeholder="Ex: Musculação, Estética"
              />
            </div>

            <div className="field-group">
              <label>Score Qualificação</label>
              <div className="score-display">
                <div className="score-progress">
                  <div 
                    className="score-fill" 
                    style={{ width: `${activeConv.lead?.scoreQualificacao || 0}%` }}
                  ></div>
                </div>
                <span>{activeConv.lead?.scoreQualificacao || 0}/100</span>
              </div>
            </div>

            <div className="field-group">
              <label>Observações do Atendente</label>
              <textarea 
                value={activeConv.lead?.observacoes || ''} 
                onChange={(e) => handleUpdateLeadField('observacoes', e.target.value)}
                placeholder="Insira detalhes sobre o atendimento manual..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Estilos específicos da Inbox */}
      <style jsx>{`
        .inbox-view {
          display: flex;
          height: calc(100vh - var(--header-height) - 64px);
          overflow: hidden;
          background: rgba(13, 17, 28, 0.45);
        }

        .inbox-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          gap: 16px;
        }

        /* Sidebar */
        .inbox-sidebar {
          width: 320px;
          border-right: 1px solid hsl(var(--border));
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .search-box {
          padding: 16px;
          border-bottom: 1px solid hsl(var(--border));
          display: flex;
          align-items: center;
          gap: 10px;
          background: hsl(var(--bg-secondary) / 0.3);
        }

        .search-icon {
          width: 18px;
          height: 18px;
          color: hsl(var(--text-muted));
        }

        .search-box input {
          background: transparent;
          border: none;
          outline: none;
          color: white;
          width: 100%;
          font-size: 0.9rem;
        }

        .chats-list {
          flex: 1;
          overflow-y: auto;
        }

        .no-chats {
          text-align: center;
          color: hsl(var(--text-muted));
          margin-top: 32px;
          font-size: 0.9rem;
        }

        .chat-item {
          padding: 16px;
          border-bottom: 1px solid hsl(var(--border) / 0.5);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chat-item:hover {
          background: hsl(var(--bg-tertiary) / 0.4);
        }

        .chat-item.active {
          background: hsl(var(--primary) / 0.1);
          border-left: 3px solid hsl(var(--primary));
        }

        .chat-item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .chat-name {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .chat-time {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
        }

        .chat-item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-preview {
          font-size: 0.8rem;
          color: hsl(var(--text-secondary));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 190px;
        }

        .chat-badges {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .channel-badge {
          width: 14px;
          height: 14px;
        }

        .channel-badge.wa { color: #25d366; }
        .channel-badge.ig { color: #e1306c; }

        /* Janela de chat */
        .chat-window {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: hsl(var(--bg-primary) / 0.1);
        }

        .chat-header {
          padding: 16px 24px;
          border-bottom: 1px solid hsl(var(--border));
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: hsl(var(--bg-secondary) / 0.3);
        }

        .header-user-info h3 {
          font-size: 1.15rem;
          margin-bottom: 2px;
        }

        .chat-subtitle {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
        }

        .chat-actions {
          display: flex;
          gap: 12px;
        }

        .action-icon {
          width: 16px;
          height: 16px;
        }

        .chat-messages {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .message-bubble {
          display: flex;
          max-width: 70%;
        }

        .message-bubble.incoming {
          align-self: flex-start;
        }

        .message-bubble.outgoing {
          align-self: flex-end;
        }

        .bubble-content {
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          line-height: 1.4;
          box-shadow: var(--shadow-sm);
        }

        .incoming .bubble-content {
          background: hsl(var(--bg-tertiary));
          color: white;
          border-top-left-radius: 2px;
        }

        .outgoing .bubble-content {
          background: hsl(var(--primary));
          color: white;
          border-top-right-radius: 2px;
          box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
        }

        .bubble-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 6px;
          justify-content: flex-end;
        }

        .sender-indicator {
          width: 10px;
          height: 10px;
          margin-right: 3px;
          display: inline-block;
          vertical-align: middle;
        }

        .empty-chat {
          text-align: center;
          color: hsl(var(--text-muted));
          margin-top: 64px;
        }

        /* Form Input */
        .chat-input-form {
          padding: 16px 24px;
          border-top: 1px solid hsl(var(--border));
          background: hsl(var(--bg-secondary) / 0.3);
        }

        .chat-input-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: hsl(var(--accent-yellow));
          background: hsl(var(--accent-yellow) / 0.1);
          border: 1px solid hsl(var(--accent-yellow) / 0.2);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          margin-bottom: 12px;
        }

        .alert-bot-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        .input-wrapper {
          display: flex;
          gap: 12px;
        }

        .input-wrapper input {
          flex: 1;
          background: hsl(var(--bg-tertiary) / 0.5);
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-sm);
          color: white;
          padding: 12px 16px;
          outline: none;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }

        .input-wrapper input:focus {
          border-color: hsl(var(--primary));
        }

        .send-icon {
          width: 16px;
          height: 16px;
        }

        /* Inspetor de Leads */
        .lead-inspector {
          width: 280px;
          border-left: 1px solid hsl(var(--border));
          background: hsl(var(--bg-secondary) / 0.3);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .inspector-header {
          padding: 18px;
          border-bottom: 1px solid hsl(var(--border));
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-icon {
          width: 18px;
          height: 18px;
          color: hsl(var(--primary));
        }

        .inspector-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-group label {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          font-weight: 600;
          text-transform: uppercase;
        }

        .field-group input, 
        .field-group select, 
        .field-group textarea {
          background: hsl(var(--bg-tertiary) / 0.5);
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-sm);
          color: white;
          padding: 8px 12px;
          outline: none;
          font-size: 0.9rem;
        }

        .field-group textarea {
          min-height: 100px;
          resize: none;
          font-family: inherit;
        }

        .score-display {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .score-progress {
          flex: 1;
          height: 8px;
          background: hsl(var(--border));
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          background: hsl(var(--primary));
          border-radius: var(--radius-full);
        }

        .empty-window {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: hsl(var(--text-muted));
          gap: 16px;
        }

        .big-bot-icon {
          width: 64px;
          height: 64px;
          color: hsl(var(--border-light));
        }
      `}</style>
    </div>
  );
}
