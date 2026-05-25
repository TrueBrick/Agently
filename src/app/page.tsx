'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  CheckCircle, 
  TrendingUp, 
  ArrowUpRight, 
  AlertTriangle,
  Activity,
  Bot
} from 'lucide-react';

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [leadsRes, convsRes, tenantRes] = await Promise.all([
          fetch('/api/leads').then((res) => res.json()),
          fetch('/api/conversations').then((res) => res.json()),
          fetch('/api/config').then((res) => res.json()),
        ]);

        setLeads(Array.isArray(leadsRes) ? leadsRes : []);
        setConversations(Array.isArray(convsRes) ? convsRes : []);
        setTenant(tenantRes);
      } catch (e) {
        console.error('Erro ao buscar dados do dashboard:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Métricas calculadas
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter((l) => l.status === 'qualificado').length;
  const inProgressLeads = leads.filter((l) => l.status === 'em_qualificacao').length;
  const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;
  
  const humanRequiredCount = conversations.filter((c) => c.status === 'human_required').length;
  const botHandledCount = conversations.length - humanRequiredCount;
  const automationRate = conversations.length > 0 ? Math.round((botHandledCount / conversations.length) * 100) : 100;

  // Leads quentes recentes
  const hotLeads = leads
    .filter((l) => l.scoreQualificacao >= 50)
    .sort((a, b) => b.scoreQualificacao - a.scoreQualificacao)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando métricas do painel...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-view">
      {/* Banner de Info do Tenant */}
      <div className="tenant-banner glass-panel">
        <div className="banner-left">
          <Bot className="banner-bot-icon" />
          <div>
            <h2>{tenant?.name || 'Academia Iron & Soul'}</h2>
            <p>Nicho: {tenant?.niche || 'Academia de Jiu-Jitsu e Crossfit'}</p>
          </div>
        </div>
        <div className="banner-right">
          <span className="badge badge-success">Operação Saudável</span>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="metrics-grid">
        <div className="metric-card glass-panel glass-panel-hover">
          <div className="card-header">
            <span className="card-title">Total de Leads</span>
            <Users className="card-icon blue" />
          </div>
          <div className="card-value">{totalLeads}</div>
          <div className="card-sub">
            <TrendingUp className="trend-icon" />
            <span>+12% este mês</span>
          </div>
        </div>

        <div className="metric-card glass-panel glass-panel-hover">
          <div className="card-header">
            <span className="card-title">Leads Qualificados</span>
            <CheckCircle className="card-icon emerald" />
          </div>
          <div className="card-value">{qualifiedLeads}</div>
          <div className="card-sub">
            <span>{inProgressLeads} em qualificação</span>
          </div>
        </div>

        <div className="metric-card glass-panel glass-panel-hover">
          <div className="card-header">
            <span className="card-title">Taxa de Qualificação</span>
            <TrendingUp className="card-icon purple" />
          </div>
          <div className="card-value">{conversionRate}%</div>
          <div className="card-sub">
            <span>Score médio dos leads</span>
          </div>
        </div>

        <div className="metric-card glass-panel glass-panel-hover">
          <div className="card-header">
            <span className="card-title">Automático por IA</span>
            <Activity className="card-icon yellow" />
          </div>
          <div className="card-value">{automationRate}%</div>
          <div className="card-sub">
            <span>{humanRequiredCount} conversas na fila humana</span>
          </div>
        </div>
      </div>

      {/* Seção Split */}
      <div className="dashboard-split">
        {/* Fila Humana */}
        <div className="split-column glass-panel">
          <h3>Fila de Handoff Humano ({humanRequiredCount})</h3>
          {humanRequiredCount === 0 ? (
            <div className="empty-state">
              <CheckCircle className="empty-icon text-emerald" />
              <p>Nenhuma conversa precisa de intervenção manual no momento.</p>
            </div>
          ) : (
            <div className="list-items">
              {conversations
                .filter((c) => c.status === 'human_required')
                .map((c) => (
                  <div key={c.id} className="list-item">
                    <div className="item-details">
                      <span className="item-name">{c.lead?.nome}</span>
                      <span className="item-sub">Última msg: {c.messages?.[c.messages.length - 1]?.content || 'Sem mensagens'}</span>
                    </div>
                    <span className="badge badge-danger">Urgente</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Leads Quentes */}
        <div className="split-column glass-panel">
          <h3>Leads Mais Quentes (Score &gt; 50)</h3>
          {hotLeads.length === 0 ? (
            <div className="empty-state">
              <Users className="empty-icon text-muted" />
              <p>Sem leads com alta qualificação ainda.</p>
            </div>
          ) : (
            <div className="list-items">
              {hotLeads.map((lead) => (
                <div key={lead.id} className="list-item">
                  <div className="item-details">
                    <span className="item-name">{lead.nome}</span>
                    <span className="item-sub">Interesse: {lead.interesse || 'A definir'}</span>
                  </div>
                  <div className="score-container">
                    <span className="score-label">Score</span>
                    <span className="score-value">{lead.scoreQualificacao}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Estilos específicos da Dashboard */}
      <style jsx>{`
        .dashboard-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .tenant-banner {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-left: 4px solid hsl(var(--primary));
        }

        .banner-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .banner-bot-icon {
          width: 40px;
          height: 40px;
          color: hsl(var(--primary));
          background: hsl(var(--primary) / 0.1);
          padding: 8px;
          border-radius: var(--radius-md);
        }

        .banner-left h2 {
          font-size: 1.35rem;
          margin-bottom: 2px;
        }

        .banner-left p {
          font-size: 0.85rem;
          color: hsl(var(--text-secondary));
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .metric-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-title {
          font-size: 0.9rem;
          font-weight: 500;
          color: hsl(var(--text-secondary));
        }

        .card-icon {
          width: 22px;
          height: 22px;
        }

        .card-icon.blue { color: hsl(var(--accent-blue)); }
        .card-icon.emerald { color: hsl(var(--accent-emerald)); }
        .card-icon.purple { color: hsl(var(--primary)); }
        .card-icon.yellow { color: hsl(var(--accent-yellow)); }

        .card-value {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          font-weight: 700;
          color: hsl(var(--text-primary));
        }

        .card-sub {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
        }

        .trend-icon {
          width: 14px;
          height: 14px;
          color: hsl(var(--accent-emerald));
        }

        .dashboard-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 992px) {
          .dashboard-split {
            grid-template-columns: 1fr;
          }
        }

        .split-column {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 300px;
        }

        .split-column h3 {
          font-size: 1.1rem;
          border-bottom: 1px solid hsl(var(--border));
          padding-bottom: 12px;
          margin-bottom: 4px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 12px;
          color: hsl(var(--text-muted));
          text-align: center;
          padding: 32px;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
        }
        
        .text-emerald { color: hsl(var(--accent-emerald)); }

        .list-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: hsl(var(--bg-tertiary) / 0.5);
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-sm);
        }

        .item-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-name {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .item-sub {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 250px;
        }

        .score-container {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .score-label {
          font-size: 0.7rem;
          color: hsl(var(--text-muted));
        }

        .score-value {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: hsl(var(--primary));
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          gap: 16px;
          color: hsl(var(--text-secondary));
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid hsl(var(--border));
          border-top-color: hsl(var(--primary));
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
