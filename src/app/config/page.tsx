'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bot, 
  Clock, 
  Smartphone, 
  Save, 
  AlertCircle,
  Database
} from 'lucide-react';
import { Instagram } from '@/components/icons';

export default function ConfigPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [niche, setNiche] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [workingHours, setWorkingHours] = useState('');
  const [handoffTemplate, setHandoffTemplate] = useState('');
  
  // Agentes ativos
  const [agentReceptionist, setAgentReceptionist] = useState(true);
  const [agentFaq, setAgentFaq] = useState(true);
  const [agentQualifier, setAgentQualifier] = useState(true);
  const [agentScheduler, setAgentScheduler] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data) {
          setTenant(data);
          setBusinessName(data.name || '');
          setNiche(data.niche || '');
          setDescription(data.description || '');
          setPrimaryColor(data.primaryColor || '#6366f1');
          
          const onboard = data.onboardingData || {};
          setWorkingHours(onboard.workingHours || '');
          setHandoffTemplate(onboard.handoffTemplate || '');
          
          if (onboard.agents) {
            setAgentReceptionist(onboard.agents.receptionist !== false);
            setAgentFaq(onboard.agents.faq !== false);
            setAgentQualifier(onboard.agents.qualifier !== false);
            setAgentScheduler(onboard.agents.scheduler !== false);
          }
        }
      } catch (e) {
        console.error('Erro ao ler config:', e);
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const body = {
        name: businessName,
        niche,
        description,
        primaryColor,
        onboardingData: {
          workingHours,
          handoffTemplate,
          agents: {
            receptionist: agentReceptionist,
            faq: agentFaq,
            qualifier: agentQualifier,
            scheduler: agentScheduler,
          }
        }
      };

      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Erro ao salvar config:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="config-loading">
        <div className="spinner"></div>
        <p>Acessando configurações do Atendly...</p>
      </div>
    );
  }

  return (
    <div className="config-view">
      <form onSubmit={handleSave} className="config-form">
        {/* Lado Esquerdo: Dados Gerais */}
        <div className="config-column">
          <div className="config-section glass-panel">
            <h3>Perfil do Negócio</h3>
            
            <div className="form-group">
              <label>Nome do Negócio</label>
              <input 
                type="text" 
                value={businessName} 
                onChange={(e) => setBusinessName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Nicho de Atuação</label>
              <input 
                type="text" 
                value={niche} 
                onChange={(e) => setNiche(e.target.value)} 
                placeholder="Ex: Estúdio de Estética, Clínica Odontológica, Academia"
                required 
              />
            </div>

            <div className="form-group">
              <label>Descrição Curta (Instrução ao Supervisor)</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Descreva o que seu negócio faz e qual o público-alvo para orientar os agentes de IA..."
              />
            </div>

            <div className="form-group">
              <label>Cor da Marca (Interface/Playground)</label>
              <div className="color-picker-wrapper">
                <input 
                  type="color" 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)} 
                />
                <input 
                  type="text" 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="config-section glass-panel">
            <h3>Horário de Funcionamento &amp; Handoff</h3>
            
            <div className="form-group">
              <label>Horários Declarados</label>
              <input 
                type="text" 
                value={workingHours} 
                onChange={(e) => setWorkingHours(e.target.value)} 
                placeholder="Ex: Segunda a Sexta das 08h às 22h, Sábado das 08h às 14h"
              />
            </div>

            <div className="form-group">
              <label>Mensagem de Handoff Humano</label>
              <textarea 
                value={handoffTemplate} 
                onChange={(e) => setHandoffTemplate(e.target.value)} 
                placeholder="Mensagem disparada automaticamente antes de transferir a conversa para a inbox humana..."
              />
            </div>
          </div>
        </div>

        {/* Lado Direito: Canais e Agentes */}
        <div className="config-column">
          <div className="config-section glass-panel">
            <h3>Agentes de IA Ativos</h3>
            
            <div className="agent-checkbox-list">
              <div className="agent-checkbox-item">
                <div className="agent-info">
                  <Bot className="agent-icon" />
                  <div>
                    <h4>Agente Recepcionista</h4>
                    <p>Faz a primeira saudação e boas-vindas.</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={agentReceptionist} 
                  onChange={(e) => setAgentReceptionist(e.target.checked)} 
                />
              </div>

              <div className="agent-checkbox-item">
                <div className="agent-info">
                  <Bot className="agent-icon" />
                  <div>
                    <h4>Agente de FAQ / RAG</h4>
                    <p>Responde dúvidas com base nas perguntas cadastradas.</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={agentFaq} 
                  onChange={(e) => setAgentFaq(e.target.checked)} 
                />
              </div>

              <div className="agent-checkbox-item">
                <div className="agent-info">
                  <Bot className="agent-icon" />
                  <div>
                    <h4>Agente Qualificador</h4>
                    <p>Faz triagem e qualifica novos leads no CRM.</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={agentQualifier} 
                  onChange={(e) => setAgentQualifier(e.target.checked)} 
                />
              </div>

              <div className="agent-checkbox-item">
                <div className="agent-info">
                  <Bot className="agent-icon" />
                  <div>
                    <h4>Agente de Agendamento</h4>
                    <p>Confirma datas, horários e serviços na agenda.</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={agentScheduler} 
                  onChange={(e) => setAgentScheduler(e.target.checked)} 
                />
              </div>
            </div>
          </div>

          <div className="config-section glass-panel">
            <h3>Canais de Entrada</h3>
            
            <div className="channel-list">
              <div className="channel-item">
                <div className="channel-info">
                  <Smartphone className="channel-icon wa" />
                  <div>
                    <h4>WhatsApp Cloud API</h4>
                    <span className="badge badge-success">Simulado (Playground)</span>
                  </div>
                </div>
                <span className="channel-status online">Pronto</span>
              </div>

              <div className="channel-item">
                <div className="channel-info">
                  <Instagram className="channel-icon ig" />
                  <div>
                    <h4>Instagram Direct</h4>
                    <span className="badge badge-success">Simulado (Playground)</span>
                  </div>
                </div>
                <span className="channel-status online">Pronto</span>
              </div>
            </div>
          </div>

          <div className="config-section glass-panel status-box">
            <div className="status-item">
              <Database className="status-icon" />
              <div>
                <h4>Banco de Dados</h4>
                <p>{process.env.DATABASE_URL ? 'Conectado via Prisma PostgreSQL' : 'Modo Simulador Local (JSON)'}</p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="config-actions">
            {success && (
              <div className="success-toast">
                <AlertCircle className="toast-icon" />
                <span>Configurações salvas com sucesso!</span>
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-save" disabled={saving}>
              <Save className="btn-icon" />
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Estilos específicos de Configurações */}
      <style jsx>{`
        .config-view {
          height: 100%;
        }

        .config-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          gap: 16px;
        }

        .config-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 992px) {
          .config-form {
            grid-template-columns: 1fr;
          }
        }

        .config-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .config-section {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .config-section h3 {
          font-size: 1.1rem;
          border-bottom: 1px solid hsl(var(--border));
          padding-bottom: 12px;
          margin-bottom: 4px;
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

        .form-group input,
        .form-group textarea,
        .form-group select {
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

        .color-picker-wrapper {
          display: flex;
          gap: 12px;
        }

        .color-picker-wrapper input[type="color"] {
          width: 48px;
          height: 40px;
          padding: 0;
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        .color-picker-wrapper input[type="text"] {
          flex: 1;
        }

        /* Agentes check-list */
        .agent-checkbox-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .agent-checkbox-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: hsl(var(--bg-tertiary) / 0.3);
          border: 1px solid hsl(var(--border) / 0.5);
          border-radius: var(--radius-sm);
        }

        .agent-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .agent-icon {
          width: 24px;
          height: 24px;
          color: hsl(var(--primary));
        }

        .agent-info h4 {
          font-size: 0.95rem;
          margin-bottom: 2px;
        }

        .agent-info p {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
        }

        .agent-checkbox-item input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: hsl(var(--primary));
        }

        /* Canais */
        .channel-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .channel-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: hsl(var(--bg-tertiary) / 0.3);
          border: 1px solid hsl(var(--border) / 0.5);
          border-radius: var(--radius-sm);
        }

        .channel-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .channel-icon {
          width: 24px;
          height: 24px;
        }

        .channel-icon.wa { color: #25d366; }
        .channel-icon.ig { color: #e1306c; }

        .channel-info h4 {
          font-size: 0.95rem;
          margin-bottom: 2px;
        }

        .channel-status {
          font-size: 0.8rem;
          font-weight: 500;
        }

        .channel-status.online {
          color: hsl(var(--accent-emerald));
        }

        /* Status box */
        .status-box {
          background: hsl(var(--bg-secondary) / 0.2);
          border: 1px solid hsl(var(--border) / 0.5);
        }

        .status-item {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .status-icon {
          width: 24px;
          height: 24px;
          color: hsl(var(--text-muted));
        }

        .status-item h4 {
          font-size: 0.95rem;
          margin-bottom: 2px;
        }

        .status-item p {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
        }

        /* Salvar */
        .config-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 16px;
          margin-top: 12px;
        }

        .btn-save {
          width: 180px;
        }

        .success-toast {
          display: flex;
          align-items: center;
          gap: 8px;
          color: hsl(var(--accent-emerald));
          font-size: 0.9rem;
          background: hsl(var(--accent-emerald) / 0.1);
          border: 1px solid hsl(var(--accent-emerald) / 0.2);
          padding: 8px 16px;
          border-radius: var(--radius-sm);
        }

        .toast-icon {
          width: 16px;
          height: 16px;
        }
      `}</style>
    </div>
  );
}
