'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Smartphone, 
  Bot, 
  User, 
  MessageSquare,
  Terminal,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Instagram } from '@/components/icons';

export default function Simulator() {
  const [channel, setChannel] = useState<'whatsapp' | 'instagram'>('whatsapp');
  const [clientName, setClientName] = useState('Rodrigo');
  const [identifier, setIdentifier] = useState('+5511999999999');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Adicionar log inicial
    addLog('Simulador iniciado. Configure seu canal e comece a enviar mensagens.');
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString('pt-BR');
    setLogs((prev) => [`[${time}] ${text}`, ...prev]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue;
    setInputValue('');
    setLoading(true);

    // 1. Adicionar mensagem do cliente localmente na tela do celular
    const localUserMsg = {
      id: `sim-user-${Date.now()}`,
      content: userMessage,
      direction: 'in',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, localUserMsg]);
    
    addLog(`Enviando mensagem via ${channel.toUpperCase()}: "${userMessage}"`);

    try {
      // 2. Chamar a API Webhook
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          channel,
          messageContent: userMessage,
          senderName: clientName,
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        addLog(`Resposta do Webhook com sucesso.`);
        
        if (data.reply) {
          // Adicionar resposta do bot
          const localBotMsg = {
            id: `sim-bot-${Date.now()}`,
            content: data.reply,
            direction: 'out',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, localBotMsg]);
          addLog(`IA Respondeu: "${data.reply}"`);
        } else {
          addLog(`⚠️ Sem resposta da IA (A conversa pode ter sido transferida/pausada para atendimento humano).`);
        }
      } else {
        addLog(`❌ Erro no webhook: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (e: any) {
      addLog(`❌ Erro de conexão com o webhook: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setLogs([]);
    addLog('Simulador reiniciado. Histórico limpo.');
  };

  return (
    <div className="simulator-view">
      {/* Controles do Simulador */}
      <div className="simulator-controls glass-panel">
        <h3>Configuração do Cliente Simulado</h3>
        
        <div className="controls-row">
          <div className="form-group">
            <label>Canal Simulado</label>
            <div className="channel-toggle">
              <button 
                type="button" 
                className={`toggle-btn ${channel === 'whatsapp' ? 'active wa' : ''}`}
                onClick={() => { setChannel('whatsapp'); setIdentifier('+5511999999999'); }}
              >
                <Smartphone className="btn-icon" />
                <span>WhatsApp</span>
              </button>
              <button 
                type="button" 
                className={`toggle-btn ${channel === 'instagram' ? 'active ig' : ''}`}
                onClick={() => { setChannel('instagram'); setIdentifier('@rodrigodev'); }}
              >
                <Instagram className="btn-icon" />
                <span>Instagram</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Nome do Cliente</label>
            <input 
              type="text" 
              value={clientName} 
              onChange={(e) => setClientName(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>Identificador ({channel === 'whatsapp' ? 'Telefone' : 'Handle'})</label>
            <input 
              type="text" 
              value={identifier} 
              onChange={(e) => setIdentifier(e.target.value)} 
            />
          </div>

          <button className="btn btn-secondary reset-btn" onClick={handleReset}>
            <RefreshCw className="btn-icon" />
            <span>Resetar Chat</span>
          </button>
        </div>
      </div>

      {/* Grid Principal do Simulador */}
      <div className="simulator-grid">
        {/* Smartphone Mockup */}
        <div className="phone-column">
          <div className="phone-case">
            <div className="phone-screen">
              {/* Top Bar Celular */}
              <div className={`phone-header ${channel === 'whatsapp' ? 'wa-bg' : 'ig-bg'}`}>
                <div className="speaker"></div>
                <div className="phone-user-profile">
                  <div className="phone-avatar">
                    {clientName.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h4>{clientName}</h4>
                    <span className="phone-status">Online</span>
                  </div>
                </div>
              </div>

              {/* Corpo de Mensagens Celular */}
              <div className="phone-chat-body">
                <div className="phone-msg-info">
                  <Clock className="info-icon" />
                  <span>Esta é uma simulação de conversa em tempo real.</span>
                </div>
                
                {messages.map((msg) => {
                  const isUser = msg.direction === 'in';
                  return (
                    <div key={msg.id} className={`phone-bubble ${isUser ? 'user-msg' : 'bot-msg'}`}>
                      <div className="phone-bubble-content">
                        <p>{msg.content}</p>
                        <span className="phone-bubble-time">
                          {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="phone-bubble bot-msg typing">
                    <div className="phone-bubble-content">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Celular Input Bar */}
              <form onSubmit={handleSend} className="phone-input-bar">
                <input 
                  type="text" 
                  placeholder="Envie uma mensagem..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={loading}
                />
                <button type="submit" className="phone-send-btn" disabled={loading || !inputValue.trim()}>
                  <Send className="phone-send-icon" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Developer Console Logs */}
        <div className="console-column glass-panel">
          <div className="console-header">
            <Terminal className="console-icon" />
            <h4>Console de Rastreamento (Logs do Motor)</h4>
          </div>
          <div className="console-body">
            {logs.length === 0 ? (
              <p className="empty-console">Nenhum log gerado ainda.</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="console-line">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Estilos específicos do Simulador */}
      <style jsx>{`
        .simulator-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .simulator-controls {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .controls-row {
          display: flex;
          align-items: flex-end;
          gap: 20px;
          flex-wrap: wrap;
        }

        .channel-toggle {
          display: flex;
          background: hsl(var(--bg-tertiary));
          border: 1px solid hsl(var(--border));
          padding: 4px;
          border-radius: var(--radius-sm);
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          color: hsl(var(--text-secondary));
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-btn.active.wa {
          background: #25d366;
          color: white;
        }

        .toggle-btn.active.ig {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
          color: white;
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
          text-transform: uppercase;
        }

        .form-group input {
          background: hsl(var(--bg-tertiary) / 0.5);
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-sm);
          color: white;
          padding: 10px 14px;
          outline: none;
          font-size: 0.95rem;
        }

        .reset-btn {
          height: 42px;
        }

        .btn-icon {
          width: 16px;
          height: 16px;
        }

        /* Grid */
        .simulator-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 32px;
          align-items: start;
        }

        @media (max-width: 768px) {
          .simulator-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Phone case style */
        .phone-column {
          display: flex;
          justify-content: center;
        }

        .phone-case {
          width: 340px;
          height: 600px;
          background: #111;
          border: 12px solid #222;
          border-radius: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9);
          overflow: hidden;
          position: relative;
        }

        .phone-screen {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #0f121d;
        }

        .phone-header {
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          color: white;
          position: relative;
        }

        .phone-header.wa-bg {
          background: #075e54;
        }

        .phone-header.ig-bg {
          background: #121212;
          border-bottom: 1px solid #222;
        }

        .speaker {
          width: 60px;
          height: 4px;
          background: #333;
          border-radius: var(--radius-full);
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
        }

        .phone-user-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }

        .phone-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .phone-header h4 {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .phone-status {
          font-size: 0.7rem;
          opacity: 0.8;
          display: block;
        }

        .phone-chat-body {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background-image: radial-gradient(hsl(var(--border)) 1px, transparent 0);
          background-size: 16px 16px;
        }

        .phone-msg-info {
          align-self: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: hsl(var(--text-secondary));
          font-size: 0.7rem;
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          text-align: center;
          max-width: 80%;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .phone-msg-info .info-icon {
          width: 12px;
          height: 12px;
          flex-shrink: 0;
        }

        .phone-bubble {
          display: flex;
          max-width: 85%;
        }

        .phone-bubble.user-msg {
          align-self: flex-end;
        }

        .phone-bubble.bot-msg {
          align-self: flex-start;
        }

        .phone-bubble-content {
          padding: 8px 12px;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          line-height: 1.35;
          position: relative;
        }

        .user-msg .phone-bubble-content {
          background: #d9fdd3;
          color: #111;
          border-top-right-radius: 2px;
        }

        .bot-msg .phone-bubble-content {
          background: #202c33;
          color: white;
          border-top-left-radius: 2px;
        }

        .phone-bubble-time {
          font-size: 0.65rem;
          display: block;
          text-align: right;
          margin-top: 4px;
          opacity: 0.6;
        }

        .user-msg .phone-bubble-time {
          color: #666;
        }

        /* Typing indicators */
        .typing-dots {
          display: flex;
          gap: 4px;
          padding: 4px 6px;
        }

        .typing-dots span {
          width: 6px;
          height: 6px;
          background: #8696a0;
          border-radius: 50%;
          animation: bounce 1.3s infinite ease-in-out;
        }

        .typing-dots span:nth-child(2) { animation-delay: 0.15s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.3s; }

        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }

        /* Input */
        .phone-input-bar {
          padding: 10px 14px;
          background: #1f2c34;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .phone-input-bar input {
          flex: 1;
          background: #2a3942;
          border: none;
          outline: none;
          color: white;
          font-size: 0.85rem;
          padding: 10px 16px;
          border-radius: var(--radius-full);
        }

        .phone-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #00a884;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .phone-send-btn:disabled {
          background: #2a3942;
          color: #8696a0;
          cursor: default;
        }

        .phone-send-icon {
          width: 16px;
          height: 16px;
          margin-left: 2px;
        }

        /* Console styling */
        .console-column {
          height: 600px;
          display: flex;
          flex-direction: column;
          background: rgba(10, 15, 30, 0.8);
          border: 1px solid #1a243d;
        }

        .console-header {
          padding: 16px;
          border-bottom: 1px solid #1a243d;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.3);
        }

        .console-icon {
          width: 18px;
          height: 18px;
          color: hsl(var(--primary));
        }

        .console-body {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.8rem;
          color: #4af626;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .console-line {
          word-break: break-all;
          line-height: 1.4;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          padding-bottom: 6px;
        }

        .empty-console {
          color: hsl(var(--text-muted));
          text-align: center;
          margin-top: 64px;
        }
      `}</style>
    </div>
  );
}
