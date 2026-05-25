'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Inbox, 
  Users, 
  HelpCircle, 
  Settings, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Inbox / Chat', path: '/inbox', icon: Inbox },
    { name: 'Leads / CRM', path: '/leads', icon: Users },
    { name: 'Base FAQ', path: '/faq', icon: HelpCircle },
    { name: 'Configurações', path: '/config', icon: Settings },
    { name: 'Simulador', path: '/simulator', icon: Sparkles },
  ];

  return (
    <html lang="pt-BR">
      <head>
        <title>Atendly — Painel Administrativo</title>
        <meta name="description" content="Atendimento Inteligente e Orquestração de Agentes para PMEs" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <div className="dashboard-container">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-logo">
              <MessageSquare className="logo-icon" />
              <span>Atendly</span>
            </div>
            <nav className="sidebar-nav">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="nav-icon" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="sidebar-footer">
              <div className="status-indicator">
                <span className="dot online"></span>
                <span>Motor de Agentes Ativo</span>
              </div>
            </div>
          </aside>

          {/* Main Workspace Area */}
          <main className="main-content">
            <header className="main-header">
              <div className="header-info">
                <h1>{menuItems.find((m) => m.path === pathname)?.name || 'Atendly'}</h1>
              </div>
              <div className="user-profile">
                <div className="profile-avatar">RA</div>
                <div className="profile-details">
                  <span className="profile-name">Rodrigo Admin</span>
                  <span className="profile-role">Plano Enterprise</span>
                </div>
              </div>
            </header>
            <div className="content-inner">
              {children}
            </div>
          </main>
        </div>

        {/* Stylesheet específico do Layout */}
        <style jsx global>{`
          .sidebar {
            width: var(--sidebar-width);
            background: hsl(var(--bg-secondary));
            border-right: 1px solid hsl(var(--border));
            display: flex;
            flex-direction: column;
            height: 100vh;
            padding: 24px 16px;
            flex-shrink: 0;
          }

          .sidebar-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 12px;
            margin-bottom: 32px;
          }

          .sidebar-logo span {
            font-family: 'Outfit', sans-serif;
            font-size: 1.45rem;
            font-weight: 700;
            background: linear-gradient(135deg, #fff 0%, hsl(var(--primary)) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.03em;
          }

          .logo-icon {
            color: hsl(var(--primary));
            width: 28px;
            height: 28px;
          }

          .sidebar-nav {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex: 1;
          }

          .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: var(--radius-sm);
            color: hsl(var(--text-secondary));
            font-weight: 500;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .nav-item:hover {
            background: hsl(var(--bg-tertiary));
            color: hsl(var(--text-primary));
          }

          .nav-item.active {
            background: hsl(var(--primary) / 0.15);
            color: hsl(var(--primary));
            border-left: 3px solid hsl(var(--primary));
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
          }

          .nav-icon {
            width: 20px;
            height: 20px;
          }

          .sidebar-footer {
            padding-top: 16px;
            border-top: 1px solid hsl(var(--border));
          }

          .status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            color: hsl(var(--text-muted));
          }

          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }

          .dot.online {
            background: hsl(var(--accent-emerald));
            box-shadow: 0 0 8px hsl(var(--accent-emerald) / 0.6);
          }

          .main-header {
            height: var(--header-height);
            background: hsl(var(--bg-secondary) / 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid hsl(var(--border));
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 32px;
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .header-info h1 {
            font-size: 1.5rem;
            color: hsl(var(--text-primary));
          }

          .user-profile {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .profile-avatar {
            width: 36px;
            height: 36px;
            background: hsl(var(--primary));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            color: white;
            font-size: 0.9rem;
          }

          .profile-details {
            display: flex;
            flex-direction: column;
          }

          .profile-name {
            font-weight: 500;
            font-size: 0.9rem;
          }

          .profile-role {
            font-size: 0.75rem;
            color: hsl(var(--text-muted));
          }

          .content-inner {
            padding: 32px;
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: calc(100vh - var(--header-height));
          }

          @media (max-width: 768px) {
            .dashboard-container {
              flex-direction: column;
            }
            .sidebar {
              width: 100%;
              height: auto;
              padding: 16px;
            }
            .sidebar-logo {
              margin-bottom: 16px;
            }
            .content-inner {
              padding: 16px;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
