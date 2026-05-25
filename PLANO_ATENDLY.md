# PLANO MESTRE — ATENDLY

**Atendimento inteligente, humano e escalável para qualquer negócio.**

> Versão: 1.0 — Maio/2026
> Status: Documento de referência mestre para desenvolvimento, comercialização e operação.

---

## Sumário

1. Visão geral do sistema
2. Conceito do produto
3. Arquitetura recomendada
4. Stack de ferramentas recomendada (3 opções)
5. Arquitetura de agentes
6. Gatilhos e roteamento (matriz)
7. Modelo de personalização por nicho
8. MVP recomendado
9. Fluxos principais de atendimento
10. Campos necessários no cadastro do lead/cliente
11. Base de conhecimento e FAQ editável
12. Painel administrativo
13. Atendimento manual e handoff humano
14. Notificações
15. Mensagens prontas (templates)
16. Código limpo e organização técnica
17. Modelo de dados
18. Integrações possíveis
19. Passo a passo de implementação
20. Testes antes do deploy
21. Deploy e monitoramento
22. Métricas de sucesso
23. Escala
24. Riscos e decisões importantes
25. Checklist final
26. Entregáveis finais

---

## 1. Visão geral do sistema

### O que o sistema faz
O Atendly é uma plataforma de atendimento automatizado multicanal que centraliza mensagens, qualifica leads, responde dúvidas frequentes, agenda compromissos, dispara notificações e aciona pessoas reais quando necessário. Pense nele como uma **recepcionista digital incansável** que conhece o negócio do cliente como se trabalhasse lá há anos: sabe os horários, os preços, os serviços, os responsáveis e as regras — e nunca esquece de dar follow-up.

### Para quais nichos funciona
Academias, escolas, clínicas, barbearias, estúdios de estética, restaurantes, consultorias, prestadores de serviço, e-commerces, negócios locais, infoprodutores, times comerciais B2B. Qualquer negócio que receba mensagens repetitivas, perca leads por demora ou tenha equipe sobrecarregada respondendo o óbvio.

### Quem usa
- **O dono / gestor do negócio** — configura, recebe relatórios e leads quentes.
- **A equipe comercial / atendentes humanos** — assume conversas quando o bot escala.
- **O cliente final / lead** — conversa com o sistema pelos canais.
- **A equipe Atendly** — opera o painel master e dá suporte aos clientes.

### Canais no início (MVP)
- WhatsApp (via API oficial Cloud API).
- Instagram Direct.

### Canais futuros
Site (chat widget), landing pages, e-mail, Facebook Messenger, Telegram, SMS, Google Business Chat, Webhooks para canais customizados.

### Quais problemas resolve
1. Lead perdido por demora na primeira resposta.
2. Equipe sobrecarregada respondendo as mesmas perguntas.
3. Mensagens espalhadas em vários celulares pessoais.
4. Falta de histórico do cliente.
5. Agendamentos manuais que geram retrabalho.
6. Esquecimento de follow-up.
7. Falta de notificação para o time quando algo urgente acontece.
8. Falta de dados para entender o que converte ou não.

### Como o sistema se adapta ao ramo informado
Toda a "personalidade" do bot vem de **dados de configuração**, não de código. O cliente preenche um onboarding (ramo, serviços, preços, regras, FAQ, equipe). Esse pacote vira o **contexto dinâmico** injetado nos prompts dos agentes de IA, nos templates de mensagem e nas regras dos gatilhos. Isso permite que **o mesmo motor** atenda uma academia de Jiu-Jitsu e uma clínica de estética com tom, vocabulário e fluxo totalmente diferentes.

**Analogia:** O motor do Atendly é como uma franquia padrão de cozinha industrial. A estrutura é igual em todo lugar (fogão, geladeira, pia), mas o cardápio (configuração) muda em cada loja.

---

## 2. Conceito do produto

### Comparação das abordagens

| Abordagem | O que é | Margem | Velocidade | Defensibilidade | Risco |
|-----------|---------|--------|------------|-----------------|-------|
| Operação interna | Você atende clientes como agência | Baixa | Alta no início | Baixa | Você é o gargalo |
| Serviço para clientes | Você implanta caso a caso, cobra setup + mensalidade | Média | Média | Média | Difícil escalar |
| SaaS puro | Plataforma self-service onde o cliente configura sozinho | Alta | Lenta no início | Alta | Exige produto maduro |
| **Híbrido (recomendado)** | Plataforma multi-tenant + onboarding assistido | Alta crescente | Média | Alta | Equilibrado |

### Recomendação inicial: **Híbrido — Serviço com plataforma própria, evoluindo para SaaS**

**Por quê:**
- Você começa cobrando setup + mensalidade alta (R$ X de setup + R$ Y/mês), entregando feito-pra-você.
- A cada cliente implantado, você consolida o produto. O que era manual vira recurso configurável.
- Em 6–12 meses, o painel já permite que clientes mais técnicos configurem partes sozinhos.
- Em 12–24 meses, você abre planos self-service para pequenos negócios e mantém o "assistido" como plano premium.

**Analogia:** Como academia de musculação. Começa com personal trainer 1:1 (margem boa, atende poucos). Depois vira treinos padronizados em grupo (alguma escala). Por fim, vira app com IA que prescreve treino sozinho (escala máxima). Você não pula etapas — vai do personal ao app porque cada etapa ensina o produto da próxima.

---

## 3. Arquitetura recomendada

Arquitetura **modular e desacoplada**. Cada bloco tem uma responsabilidade clara e pode ser trocado sem quebrar os outros.

```
┌─────────────────────────────────────────────────────────────┐
│                    CANAIS DE ENTRADA                         │
│  WhatsApp │ Instagram │ Site │ Email │ Telegram │ Webhook  │
└────────────────────────┬────────────────────────────────────┘
                         │ webhook normalizado
┌────────────────────────▼────────────────────────────────────┐
│            CAMADA DE ROTEAMENTO (Router)                     │
│  identifica cliente (tenant) + canal + sessão + intenção    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              ORQUESTRADOR DE AGENTES                         │
│  decide qual agente assume com base em intenção/contexto    │
└──┬──────┬───────┬───────┬───────┬────────┬──────────────────┘
   │      │       │       │       │        │
   ▼      ▼       ▼       ▼       ▼        ▼
Recep. Qualif. Vendas Agendto Suporte Cobrança ... Supervisor
   │      │       │       │       │        │
   └──────┴───────┴───────┴───────┴────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              CAMADA DE SERVIÇOS (Domain)                     │
│  CRM │ Agenda │ Base Conhecimento │ Notificações │ Logs    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│         BANCO DE DADOS + INTEGRAÇÕES EXTERNAS                │
│  Postgres │ Redis │ Calendar │ Email │ Pagamentos │ etc    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│        PAINEL ADMIN + ATENDIMENTO MANUAL (Web)               │
│  Inbox unificada │ CRM │ Config │ Métricas │ Permissões    │
└─────────────────────────────────────────────────────────────┘
```

### Componentes em detalhe

| Componente | Responsabilidade | Tecnologias típicas |
|------------|------------------|---------------------|
| **Canais de entrada** | Receber mensagens dos canais e normalizar em um formato único | WhatsApp Cloud API, Meta Graph API, webhooks |
| **Camada de roteamento** | Identificar tenant, sessão e intenção; idempotência de mensagens | Backend próprio (Node/Python) ou n8n |
| **Orquestrador de agentes** | Decidir qual agente atende; manter estado da conversa | LangGraph, LangChain, código próprio |
| **Agentes** | Cada um com prompt + ferramentas próprias; especialistas em uma função | OpenAI / Anthropic / Gemini |
| **Base de conhecimento** | FAQ, serviços, preços, regras — consultável pelos agentes | Postgres + pgvector ou Supabase |
| **CRM** | Cadastro do lead/cliente, status, histórico, próxima ação | Tabelas próprias ou HubSpot/Pipedrive |
| **Banco de dados** | Persistência de tudo (conversas, leads, agendamentos, logs) | Postgres (Supabase recomendado) |
| **Agenda** | Disponibilidade, marcações, lembretes | Google Calendar API ou Cal.com |
| **Motor de notificações** | Envia WhatsApp/Email para usuários internos e externos | Fila própria + provedores (Resend, Twilio) |
| **Painel administrativo** | Web app para configurar e operar | Next.js + Supabase Auth |
| **Atendimento humano** | Inbox onde atendente assume e bot pausa | Mesmo painel |
| **Logs e auditoria** | Tudo o que aconteceu, quem fez, quando | Postgres append-only + Sentry |
| **Analytics** | Métricas de conversão, tempo, custo | Metabase / dashboards no próprio painel |
| **Integrações externas** | Calendário, pagamento, planilhas | Via adaptadores isolados |
| **Deploy e monitoramento** | Onde roda, como é observado | Railway/Render/Vercel + Sentry + Better Stack |

### Multi-tenant por design
Toda tabela carrega `client_id` (ou `tenant_id`). O roteador identifica o tenant pelo número de WhatsApp / conta de Instagram que recebeu a mensagem. Isso é o que permite **um motor servir N clientes** sem misturar dados.

---

## 4. Stack de ferramentas recomendada

### Stack A — No-code/Low-code (MVP em dias)

| Ferramenta | Função | Por que |
|-----------|--------|---------|
| **n8n** | Orquestração de fluxos visuais | Open-source, conecta tudo, self-host barato |
| **Z-API ou Evolution API** | Gateway não-oficial de WhatsApp | Rápido, mais barato que API oficial no início (atenção: TOS Meta) |
| **Instagram Graph API** (via Meta) | Receber DMs do Instagram | Oficial e gratuito |
| **OpenAI / Anthropic API** | Cérebro dos agentes | Estado da arte, fácil de integrar |
| **Airtable ou Google Sheets** | "Banco de dados" do MVP | Cliente edita FAQ direto na planilha |
| **Google Calendar** | Agenda | Universal e grátis |
| **Resend ou SMTP** | E-mail transacional | Simples |
| **Cal.com** | Agendamento avançado (opcional) | Open-source, integra com Calendar |

- **Vantagens:** entrega em 1–2 semanas, baixo custo inicial, fácil iterar.
- **Limitações:** difícil customizar fora do n8n, gateways não oficiais sob risco regulatório, escala limitada (centenas de tenants no máximo).
- **Quando usar:** validação do produto, primeiros 1–20 clientes pagantes.
- **Dificuldade:** ⭐⭐ (baixa-média).
- **Perfil ideal:** founder solo / pequena equipe testando hipóteses.

### Stack B — Híbrida (recomendada para sair do MVP)

| Ferramenta | Função | Por que |
|-----------|--------|---------|
| **Next.js (TypeScript)** | Painel admin + APIs internas | Fullstack moderno, ecossistema gigante |
| **Supabase** | Postgres + Auth + Storage + Realtime | Resolve 80% da infra de SaaS sem ops |
| **n8n self-host** | Fluxos visuais (notificações, integrações terceiros) | Cliente avançado pode olhar fluxo |
| **WhatsApp Cloud API (oficial Meta)** | Canal WhatsApp | Único caminho regulado para escala |
| **Instagram Graph API** | Canal Instagram | Oficial |
| **OpenAI/Anthropic** + **LangGraph** | Orquestração de agentes | Estado da arte para multi-agent |
| **Redis (Upstash)** | Cache de sessão e fila leve | Simples e barato |
| **Resend** | E-mail | Excelente DX |
| **Sentry + Better Stack** | Erros e observabilidade | Padrão de mercado |
| **Vercel + Railway** | Deploy | Zero-config, ótimo para começar |

- **Vantagens:** equilibra velocidade e robustez, suporta multi-tenant, escala até milhares de tenants.
- **Limitações:** exige um dev fullstack competente; Vercel pode ficar caro em alto volume.
- **Quando usar:** a partir do 5º cliente pagante; é a stack de longo prazo.
- **Dificuldade:** ⭐⭐⭐⭐ (média-alta).
- **Perfil ideal:** time pequeno (1–3 devs) construindo SaaS sério.

### Stack C — Robusta com backend próprio

| Ferramenta | Função | Por que |
|-----------|--------|---------|
| **Backend dedicado em Node.js (NestJS) ou Python (FastAPI)** | Domínio de negócio isolado | Controle total, testabilidade, performance |
| **Postgres gerenciado (Neon/Supabase/RDS)** | Banco principal | Confiabilidade |
| **pgvector** | Busca semântica para RAG da base de conhecimento | Sem precisar de vetorial separado |
| **Redis + BullMQ ou Temporal** | Filas, jobs, workflows duráveis | Conversas longas, retries inteligentes |
| **Kafka ou NATS** (opcional, escala alta) | Streaming de eventos | Para alto volume |
| **Next.js separado** | Painel admin | Mesmo benefício da Stack B |
| **WhatsApp Cloud API + 360dialog/Gupshup como BSP** | Canal WhatsApp em escala | BSP cuida de aprovação de templates |
| **OpenAI/Anthropic + LangGraph + LLM router** | Agentes + roteamento de modelo por custo | Otimização |
| **Datadog ou Grafana Stack** | Observabilidade nível produção | Visão completa |
| **Docker + Kubernetes (GKE/EKS) ou ECS** | Deploy | Multi-região, alta disponibilidade |

- **Vantagens:** suporta milhares/dezenas de milhares de tenants, performance previsível, conformidade fácil.
- **Limitações:** alto custo de operação, exige DevOps, demora mais para iterar.
- **Quando usar:** após product-market fit, com receita recorrente saudável.
- **Dificuldade:** ⭐⭐⭐⭐⭐ (alta).
- **Perfil ideal:** startup com investimento e time de engenharia.

### Comparativo rápido

| Critério | Stack A | Stack B | Stack C |
|----------|---------|---------|---------|
| Tempo até MVP | 1–2 semanas | 4–8 semanas | 12+ semanas |
| Custo mensal inicial | ~R$ 200 | ~R$ 600 | R$ 3.000+ |
| Limite de tenants | ~50 | ~5.000 | ilimitado |
| Curva de aprendizado | Baixa | Média | Alta |
| Manutenção | Simples | Razoável | Complexa |

**Recomendação:** começar em **Stack A** para validar, migrar para **Stack B** assim que tiver 3–5 clientes pagando, considerar **Stack C** só com tração comprovada.

---

## 5. Arquitetura de agentes

Cada agente é uma **especialidade**, não uma "personalidade diferente". Pense em recepção de hospital: um faz triagem, outro marca consulta, outro cobra, outro escala para médico. Todos seguem o mesmo manual da casa, mas cada um tem ferramentas e autonomia diferentes.

### Catálogo de agentes

#### 1. Agente Recepcionista (Receptionist)
- **Função:** primeira saudação, identifica quem é a pessoa (lead novo? cliente atual?) e captura intenção inicial.
- **Entradas:** mensagem do canal, dados do tenant, dados conhecidos do contato.
- **Saídas:** classificação de intenção + handoff para outro agente.
- **Gatilhos:** toda nova conversa, ou conversa parada há mais de X horas.
- **Quando transferir para humano:** se a mensagem indicar emergência, crise emocional, ou intenção fora do escopo do negócio.
- **Dados salvos:** intenção detectada, timestamp, canal, primeiro contato sim/não.

#### 2. Agente Qualificador (Qualifier)
- **Função:** fazer 3–5 perguntas-chave para entender se o lead serve para o negócio.
- **Entradas:** intenção "interesse em serviço", critérios de qualificação do tenant.
- **Saídas:** lead classificado (frio/morno/quente) + dados estruturados (nome, objetivo, urgência, orçamento).
- **Gatilhos:** após recepção identificar interesse comercial.
- **Quando transferir:** lead "quente" segundo critério do tenant.
- **Dados salvos:** respostas das perguntas, score, classificação.

#### 3. Agente de Vendas (Sales)
- **Função:** apresentar serviço/produto, enviar preços, lidar com objeções comuns.
- **Entradas:** dados de qualificação + catálogo de serviços/ofertas do tenant.
- **Saídas:** proposta, link de pagamento, agendamento de demo.
- **Gatilhos:** lead qualificado morno/quente.
- **Quando transferir:** negociação fora da tabela, pedido de desconto não previsto, sinais de compra avançados.
- **Dados salvos:** ofertas mostradas, objeções levantadas, próxima ação.

#### 4. Agente de Agendamento (Scheduler)
- **Função:** consultar disponibilidade, confirmar slot, criar evento na agenda, enviar lembrete.
- **Entradas:** pedido de agendamento + agenda do tenant + serviço escolhido.
- **Saídas:** evento criado + confirmação ao cliente + notificação ao responsável.
- **Gatilhos:** intenção "marcar/agendar".
- **Quando transferir:** conflito de agenda complexo, pedido fora do horário, agendamento que exige aprovação.
- **Dados salvos:** evento, status (marcado/confirmado/realizado/no-show).

#### 5. Agente de Suporte (Support)
- **Função:** responder dúvidas operacionais de clientes atuais (como faço X, qual horário, onde fica).
- **Entradas:** mensagem + base de conhecimento + dados do cliente.
- **Saídas:** resposta direta ou escalonamento.
- **Gatilhos:** cliente atual com pergunta + ausência de intenção comercial.
- **Quando transferir:** dúvida sem resposta na base, reclamação, problema sensível.
- **Dados salvos:** pergunta, resposta, satisfação inferida.

#### 6. Agente Financeiro / Cobrança (Billing)
- **Função:** lembrar pagamento, enviar segunda via, confirmar quitação, negociar (limitado).
- **Entradas:** status de cobrança vindo de planilha/ERP/integração.
- **Saídas:** mensagem de cobrança, registro de promessa de pagamento.
- **Gatilhos:** cliente com fatura em aberto + dia configurado.
- **Quando transferir:** negociação real, contestação.
- **Dados salvos:** tentativas, promessa, status final.

#### 7. Agente de Reativação (Reactivation)
- **Função:** voltar a falar com leads/clientes inativos com gatilho de oferta ou novidade.
- **Entradas:** lista segmentada + mensagem de reativação configurada.
- **Saídas:** mensagem disparada + atualização de status na resposta.
- **Gatilhos:** lead sem interação há N dias / cliente cancelado há M meses.
- **Quando transferir:** se houver resposta, escalonar conforme intenção detectada.
- **Dados salvos:** campanhas, taxa de resposta.

#### 8. Agente de FAQ / Base de conhecimento (Knowledge)
- **Função:** responder qualquer pergunta consultando a base do tenant via busca semântica (RAG).
- **Entradas:** pergunta + base do tenant.
- **Saídas:** resposta + fonte (qual item da FAQ usou).
- **Gatilhos:** dúvida pontual sem fluxo claro.
- **Quando transferir:** confiança baixa na resposta.
- **Dados salvos:** pergunta, fonte usada, score de confiança.

#### 9. Agente de Notificação Interna (Notifier)
- **Função:** disparar avisos para equipe (WhatsApp/e-mail) quando algo importante acontece.
- **Entradas:** evento de negócio + regra de notificação.
- **Saídas:** mensagens enviadas + log.
- **Gatilhos:** lead quente, novo agendamento, reclamação, falha de integração, etc.
- **Quando transferir:** N/A — não conversa com cliente final.
- **Dados salvos:** notificação enviada, destinatário, canal, status de entrega.

#### 10. Agente Supervisor (Orchestrator / Router)
- **Função:** decidir qual agente assume a próxima rodada da conversa e quando passar para humano.
- **Entradas:** estado da conversa + última mensagem + perfil do contato.
- **Saídas:** decisão de roteamento.
- **Gatilhos:** cada nova mensagem.
- **Quando transferir:** sempre que regras de escalonamento humano forem atendidas.
- **Dados salvos:** decisão, motivo, agente acionado.

**Princípio:** os agentes **não conversam entre si livremente**. O Supervisor é a única peça que decide quem fala em seguida. Isso evita loops, alucinações cruzadas e facilita debug.

---

## 6. Gatilhos e roteamento

A **Matriz de Gatilhos** é o coração operacional. Cada linha descreve "quando X acontecer, faça Y, notifique Z, registre W".

| # | Intenção/Evento | Canal | Condição | Agente | Ação | Notificação | Registro |
|---|-----------------|-------|----------|--------|------|-------------|----------|
| 1 | Novo lead (primeira mensagem) | WA/IG | Contato não existe no CRM | Recepcionista → Qualificador | Saudar, capturar nome, intenção | Notificar comercial se config | `lead.created`, `conversation.started` |
| 2 | Pedido de preço | Qualquer | Mensagem contém intenção "preço/valor" | Vendas | Enviar tabela/oferta do tenant | — | `intent.price_request` |
| 3 | Pedido de agendamento | Qualquer | Intenção "agendar/marcar/horário" | Agendamento | Mostrar disponibilidade + confirmar | Notificar responsável da agenda | `appointment.created` |
| 4 | Dúvida frequente | Qualquer | Pergunta com match alto na base | FAQ | Responder direto com fonte | — | `faq.answered` |
| 5 | Reclamação | Qualquer | Sentimento negativo + palavras-chave | Supervisor | Pausar bot, escalar para humano | Notificar gestor (urgente) | `complaint.flagged` |
| 6 | Sem resposta 24h | Qualquer | Lead morno/quente parou de responder | Supervisor → Vendas | Enviar follow-up configurado | — | `followup.sent` |
| 7 | Lead quente | Qualquer | Score ≥ X após qualificação | Vendas | Apresentar oferta + opção de falar com humano | Notificar comercial (alta prioridade) | `lead.hot` |
| 8 | Cliente atual com dúvida | Qualquer | Contato existe + status cliente | Suporte | Responder com base | — | `support.message` |
| 9 | Cancelamento | Qualquer | Intenção "cancelar/desistir" | Supervisor | Pausar bot, registrar motivo | Notificar gestor + retenção | `cancellation.requested` |
| 10 | Pagamento confirmado | Webhook ext. | Recebido do gateway | Notificação interna | Enviar agradecimento + próximos passos | Notificar financeiro | `payment.received` |
| 11 | Evento importante (campanha) | Disparo | Data/hora configurada | Reativação/Notificação | Enviar campanha para segmento | — | `campaign.dispatched` |
| 12 | Mensagem fora do horário | Qualquer | Hora atual fora do funcionamento | Recepcionista | Responder com mensagem fora do horário + prometer contato | — | `out_of_hours` |
| 13 | Pedido explícito de humano | Qualquer | "quero falar com pessoa real" | Supervisor | Pausar bot, criar ticket | Notificar atendente | `handoff.requested` |
| 14 | Falha de integração | Sistema | Erro em chamada externa | Supervisor | Mensagem genérica + flag | Notificar admin | `integration.error` |
| 15 | No-show de agendamento | Job | Horário passou + sem check-in | Reativação | Mensagem de reagendamento | Notificar responsável | `appointment.no_show` |

### Como o roteamento decide
1. **Identifica o tenant** (pelo número/canal que recebeu).
2. **Identifica o contato** (cria se não existir).
3. **Detecta a intenção** (LLM classifica em N categorias do tenant).
4. **Consulta a matriz** (regra explícita > LLM).
5. **Aciona o agente** com contexto completo.
6. **Salva o evento** no log de auditoria.

---

## 7. Modelo de personalização por nicho

A personalização é **declarativa** (preenche-se um JSON/formulário) e injetada como contexto nos agentes. Não há código diferente por nicho.

### Esqueleto do "perfil do nicho"

```yaml
nicho: academia_jiu_jitsu
vocabulario:
  - aluno (não "cliente")
  - mensalidade (não "assinatura")
  - aula experimental (não "trial")
  - faixa, graduação, professor titular
servicos:
  - { nome: "Adulto", preco_min: 200, preco_max: 350, faixa: "todas" }
  - { nome: "Kids", preco_min: 180, preco_max: 280, faixa: "infantil" }
regras_comerciais:
  - "Não enviar preço final por mensagem; convidar para aula experimental."
  - "Toda matrícula passa por professor titular antes de fechar."
jornada:
  - interesse -> aula_experimental -> matricula -> mensalidade_recorrente
objecoes_comuns:
  - "Não tenho tempo" -> mostrar grade de horários
  - "Nunca treinei" -> reforçar turma iniciantes
  - "Caro" -> apresentar plano trimestral
ofertas:
  - { id: "primeiro_mes", titulo: "1ª mensalidade com 30% off", validade: "2026-06-30" }
criterios_qualificacao:
  - mora_perto_da_unidade (sim/não)
  - idade
  - objetivo (defesa pessoal / competição / condicionamento / kids)
canais_relevantes: [instagram, whatsapp]
```

### Exemplos de adaptação por nicho

**Academia**
- Vocabulário: aluno, mensalidade, faixa, aula experimental.
- Fluxo padrão: interesse → convite para aula experimental → matrícula.
- Notificação chave: novo lead quente → professor titular.

**Clínica**
- Vocabulário: paciente, consulta, convênio, especialidade.
- Fluxo: triagem leve → agendamento → confirmação 24h antes.
- Cuidado LGPD reforçado: nada de diagnóstico, sem dados sensíveis em mensagem.

**Barbearia**
- Vocabulário: cliente, serviço, barbeiro, horário.
- Fluxo: escolha de barbeiro/horário em 3 passos.
- Notificação: confirmação automática + lembrete 2h antes.

**Escola/Curso**
- Vocabulário: aluno, turma, módulo, matrícula, semestre.
- Fluxo: interesse → material informativo → agendamento de visita.
- Notificação: coordenação pedagógica quando lead pede informações de currículo.

**Restaurante**
- Vocabulário: reserva, cardápio, delivery, mesa.
- Fluxo: cardápio do dia / reservas / status do pedido.
- Integração crítica: cardápio (iFood/Anota.ai).

**E-commerce**
- Vocabulário: pedido, frete, troca, devolução, rastreio.
- Fluxo: status do pedido (via integração ERP) + suporte.
- Notificação: ticket aberto vai pro time de SAC.

**Consultoria**
- Vocabulário: diagnóstico, projeto, escopo, proposta.
- Fluxo: qualificação alta (BANT) → marcar call → proposta.
- Notificação: lead com fit alto → consultor sênior.

---

## 8. MVP recomendado

### Obrigatório no MVP (sem isso, não cobra)
- Conexão WhatsApp (Cloud API) e Instagram (Graph API).
- Onboarding básico do cliente (dados do negócio + FAQ + horários + 1 serviço/produto).
- Agente Recepcionista + Agente FAQ + Agente Supervisor.
- Inbox unificada com pausa de bot + handoff humano.
- Notificação básica por WhatsApp e e-mail para uma lista configurada.
- Log completo de mensagens.
- Painel admin com 4 telas: Configurações, Inbox, Leads, FAQ.
- Consentimento explícito (LGPD) na primeira mensagem.

### Opcional no MVP (entregar se der tempo)
- Agente de Agendamento integrado a Google Calendar.
- Templates de mensagens prontos por nicho.
- Métricas básicas (leads/dia, tempo de resposta).

### Fase 2 (após validar com 3–5 clientes)
- Agente de Vendas com catálogo dinâmico.
- Agente de Reativação + campanhas.
- Múltiplos atendentes humanos com permissões.
- Multi-unidade.
- Relatórios avançados.
- Auto-aprendizado da base com feedback humano.

### NÃO fazer no início (armadilhas)
- White label.
- Marketplace de integrações.
- App mobile próprio.
- Suporte a mais de 3 canais simultâneos.
- Cobrança recorrente via Stripe completa (use boleto/Pix manual no início).
- Plano gratuito.

### Critérios para considerar o MVP validado
- 3 clientes pagantes mensalmente por pelo menos 60 dias seguidos.
- ≥ 70% das mensagens respondidas sem intervenção humana.
- Tempo médio de primeira resposta ≤ 1 minuto.
- Nenhum incidente grave de LGPD ou bloqueio de canal.
- NPS dos donos dos negócios ≥ 8.

---

## 9. Fluxos principais de atendimento

### Fluxo universal (esqueleto)

```
[Mensagem chega]
    ↓
[Router: identifica tenant + contato + sessão]
    ↓
[Consentimento já dado?] —não→ [Pedir consentimento] → aguarda
    ↓ sim
[Bot pausado pela equipe?] —sim→ [Apenas registra, não responde]
    ↓ não
[Está em horário?] —não→ [Mensagem fora do horário + promete contato]
    ↓ sim
[Supervisor classifica intenção]
    ↓
[Aciona agente correspondente]
    ↓
[Agente responde + atualiza CRM + dispara notificação se aplicável]
    ↓
[Log + métrica]
```

### Fluxos específicos (resumidos — cada um vira um diagrama no n8n ou função no código)

**Primeiro contato**
1. Saudação personalizada com nome do negócio.
2. Pergunta aberta: "Como posso te ajudar hoje?".
3. Classifica intenção.
4. Encaminha.

**Qualificação de lead**
1. Pergunta 1 — interesse específico.
2. Pergunta 2 — urgência (quando quer começar/comprar).
3. Pergunta 3 — critério do nicho (ex.: idade, localização, orçamento).
4. Calcula score → frio/morno/quente.
5. Se quente: notifica comercial e oferece falar com humano.

**Apresentação de serviço/produto**
1. Mostra 2–3 opções mais relevantes para o que ela pediu.
2. Pergunta qual interessa.
3. Detalha + foto/link.

**Envio de preço/proposta**
1. Verifica regra do tenant: pode mandar preço? envia faixa? convida pra demo?
2. Envia conforme regra.
3. Pergunta: "quer marcar uma conversa para entender melhor?".

**Agendamento**
1. Pergunta tipo de serviço.
2. Consulta disponibilidade dos próximos 3 dias.
3. Lista 3 horários.
4. Confirma com cliente.
5. Cria evento + envia confirmação.

**Confirmação (24h antes)**
1. Mensagem: "vai confirmar [serviço] amanhã às [hora]?".
2. Opções: ✅ Confirmar / 🔄 Remarcar / ❌ Cancelar.
3. Atualiza status conforme resposta.

**Lembrete (2h antes)**
1. "Faltam 2h para [serviço]. Endereço: [link]".

**Pós-atendimento**
1. "Como foi sua experiência hoje?" → coleta NPS.
2. Se nota ≤ 6: notifica gestor.
3. Se nota ≥ 9: pede review/indicação.

**Follow-up sem resposta**
1. Após 24h sem resposta: "Oi [nome], ainda quer falar sobre [assunto]?".
2. Após +48h: oferta/conteúdo.
3. Após +7d: mensagem de despedida educada.

**Reativação**
1. Lista leads/clientes inativos N dias.
2. Mensagem com oferta sazonal.
3. Se responder, volta para fluxo principal.

**Suporte ao cliente atual**
1. Pergunta direta.
2. Agente FAQ consulta base.
3. Se não souber: handoff.

**Reclamação**
1. Identifica sentimento negativo.
2. Pausa bot imediato.
3. Mensagem empática registrando: "vou te conectar com nossa equipe agora".
4. Notifica gestor (canal prioritário).

**Encaminhamento para humano**
1. Mensagem: "te transferi para [responsável]".
2. Bot pausa.
3. Conversa fica destacada na inbox.

**Notificação interna**
1. Evento dispara.
2. Mensagem padronizada vai para destinatários do evento.
3. Confirmação de entrega registrada.

**Campanha**
1. Admin seleciona segmento + template + janela.
2. Sistema agenda envios respeitando janela de 24h da Meta.
3. Coleta respostas e devolve ao fluxo padrão.

---

## 10. Campos necessários no cadastro do lead/cliente

Modelo universal de CRM — tabela `leads` (ou `contacts`):

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | sim | Identificador único |
| tenant_id | UUID | sim | A qual cliente Atendly pertence |
| nome | string | sim | Nome do contato |
| telefone | string | quando WA | Formato E.164 (+55...) |
| email | string | opcional | Validar formato |
| instagram_handle | string | quando IG | @handle |
| canal_origem | enum | sim | whatsapp/instagram/site/email/indicacao |
| nicho_negocio | string | sim | Espelha o nicho do tenant (útil em multi-tenant analítico) |
| interesse | string | opcional | Texto livre do que pediu |
| servico_desejado | string | opcional | ID do serviço do catálogo |
| status | enum | sim | novo / em_qualificacao / qualificado / proposta / cliente / perdido / inativo |
| etapa_funil | enum | sim | topo / meio / fundo / pos-venda |
| responsavel_interno | UUID | opcional | Usuário do painel atribuído |
| historico_conversa | relação | sim | Foreign key para `conversations` |
| consentimento | bool + timestamp | sim | LGPD: aceitou termos? quando? |
| consentimento_origem | string | sim | Onde aceitou (mensagem X) |
| tags | array | opcional | Tags livres para segmentação |
| observacoes | text | opcional | Anotações manuais da equipe |
| proxima_acao | string + data | opcional | "Ligar dia X" |
| ultimo_contato_em | timestamp | sim | Auto-atualizado a cada mensagem |
| proximo_followup_em | timestamp | opcional | Agendado pelo sistema ou humano |
| valor_potencial | numeric | opcional | Ticket esperado |
| motivo_perda | string | opcional | Preenchido se status = perdido |
| score_qualificacao | int | opcional | 0–100 |
| created_at / updated_at | timestamp | sim | Auditoria |

---

## 11. Base de conhecimento e FAQ editável

Tabela `faqs`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | — |
| tenant_id | UUID | — |
| categoria | string | "horarios", "precos", "localizacao", "produtos"... |
| pergunta | string | Pergunta principal |
| variacoes | array | Outras formas de perguntar a mesma coisa |
| resposta_curta | string | Para WhatsApp (até 300 chars) |
| resposta_completa | text | Para canais sem limite |
| links | array | URLs relacionadas |
| anexos | array | Imagens/PDFs |
| escalar_humano_quando | string | "se cliente pedir desconto", etc. |
| tags | array | — |
| nicho_aplicavel | array | Lista de nichos para filtragem multi-tenant |
| ultima_atualizacao | timestamp | — |
| responsavel | UUID | Quem mantém |
| embedding | vector(1536) | Para busca semântica (pgvector) |

### Exemplos genéricos
- "Quais os horários de funcionamento?"
- "Onde fica?"
- "Como pago?"
- "Tem estacionamento?"
- "Aceita cartão?"
- "Faz delivery?"

### Exemplos por nicho

**Academia:** "Posso fazer aula experimental?", "Vocês têm kids?", "Qual a graduação dos professores?", "Tem plano família?".

**Clínica:** "Atendem [convênio]?", "Como faço a primeira consulta?", "Faz exames no local?".

**Barbearia:** "Quanto tempo demora um corte?", "Atendem barba grisalha?", "Tem pacote mensal?".

**Restaurante:** "Aceitam reserva?", "Cardápio do dia?", "Têm opção sem glúten?".

**E-commerce:** "Como rastrear meu pedido?", "Qual o prazo de troca?", "Vocês entregam em [cidade]?".

---

## 12. Painel administrativo

### Telas principais

| Tela | Função |
|------|--------|
| **Cadastro do negócio** | Editar nome, ramo, descrição, logo, cores |
| **Canais conectados** | Status do WhatsApp/Instagram, reconectar, ver número/conta |
| **FAQ** | CRUD da base, categorias, busca, importar de planilha |
| **Serviços/produtos** | Catálogo: nome, preço/faixa, descrição, foto |
| **Ofertas** | Promoções ativas com janela de validade |
| **Horários** | Funcionamento por dia, exceções, feriados |
| **Equipe** | Usuários do painel, permissões, números autorizados a receber notificação |
| **Notificações** | Regras: "quando X, avisar Y por Z" |
| **Leads (CRM)** | Lista filtravel, ficha do lead, histórico, mudança manual de status |
| **Conversas (Inbox)** | Todas as conversas; assumir/devolver bot; enviar manual |
| **Logs** | Auditoria: o que aconteceu, quando, quem fez |
| **Métricas** | Dashboard: leads, conversão, tempo de resposta, satisfação |
| **Configuração de agentes** | Quais agentes ativos, tom de voz, frases proibidas |
| **Regras de escalonamento** | Quando o bot deve passar para humano |
| **Permissões de usuários** | RBAC: admin / gerente / atendente / financeiro |

### Princípios de UX do painel
- **3 cliques no máximo** entre qualquer tela.
- **Inbox sempre acessível** (atendentes vivem nela).
- **Mobile-friendly** — gestor consulta no celular.
- **Cores neutras** — o painel é ferramenta, não show de design.

---

## 13. Atendimento manual e handoff humano

### Quando o handoff acontece (automático)
- Confiança da resposta do agente abaixo do threshold (ex.: < 0.6).
- Sentimento negativo detectado.
- Palavras-chave de crise/reclamação.
- Lead "quente" segundo critério do tenant.
- Pedido explícito ("quero falar com pessoa").
- Erro de integração (sistema externo caiu).
- Mensagem fora do escopo (ex.: spam, assédio).
- Assunto sensível (saúde séria, jurídico).

### O que acontece operacionalmente
1. Bot envia transição: *"Vou te conectar com [nome do time/pessoa]. Em instantes alguém retoma."*
2. Conversa muda para status `human_required`.
3. Notificação dispara para o time (canal definido).
4. Bot é **pausado** para essa conversa.
5. Atendente assume na inbox e responde manualmente.
6. Toda mensagem do atendente é registrada com `sent_by_human = true`.

### Como o bot volta
- Atendente clica "Encerrar atendimento + devolver bot".
- Ou: após X horas sem mensagem do humano nem do cliente, status volta para `idle` e bot reativa.
- Motivo do handoff fica registrado para análise.

### Regras importantes
- O bot **nunca** retoma sem confirmação explícita ou tempo configurado.
- Atendente pode adicionar nota interna sem enviar ao cliente.
- Histórico mostra claramente quem falou o quê (bot / atendente / cliente).

---

## 14. Notificações

### Quem pode ser notificado
- Equipe comercial (lista configurada).
- Dono / gestor.
- Atendentes / professores / responsáveis internos.
- Clientes finais.
- Leads.
- Qualquer número de WhatsApp autorizado.
- Qualquer e-mail autorizado.

### Canais
- WhatsApp (template aprovado pela Meta para mensagens fora da janela de 24h).
- E-mail (Resend/SES).
- (Futuro) Push no painel, Telegram, SMS.

### Exemplos de notificação

| Evento | Quem recebe | Canal | Conteúdo |
|--------|-------------|-------|----------|
| Novo lead quente | Comercial | WhatsApp | "🔥 Lead quente: [nome] interessado em [serviço]. Abrir conversa: [link]" |
| Novo agendamento | Responsável da agenda | WhatsApp + e-mail | "Novo agendamento: [serviço] com [cliente] em [data/hora]" |
| Confirmação de presença | Cliente | WhatsApp | "[cliente], confirmando seu [serviço] em [data]. Responda ✅ ou 🔄" |
| Falta / no-show | Responsável | WhatsApp | "[cliente] não compareceu ao [serviço] das [hora]" |
| Reclamação | Gestor | WhatsApp (prioritário) | "⚠️ Reclamação aberta por [cliente] — abra a conversa imediatamente" |
| Pagamento pendente | Cliente | WhatsApp | "[cliente], identificamos pendência de [valor]. Detalhes: [link]" |
| Aviso importante | Lista | WhatsApp | "[mensagem do gestor]" |
| Mudança de horário | Lista de afetados | WhatsApp | "Por motivo X, [serviço] foi remarcado para [data]" |
| Campanha promocional | Segmento | WhatsApp (template) | "[oferta + CTA + opt-out]" |
| Falha de integração | Admin Atendly | E-mail + Slack | "Erro em [integração] — código [X]" |

### Regras de notificação
- Toda regra é editável no painel: evento + destinatários + canal + template.
- Templates de WhatsApp fora da janela precisam estar aprovados na Meta.
- Sempre incluir opt-out em campanhas.
- Limite de frequência (anti-spam): ex.: máximo 1 notificação por contato por hora exceto crítica.

---

## 15. Mensagens prontas (templates)

Todos os templates usam variáveis substituídas em runtime: `[NOME_CLIENTE]`, `[NOME_NEGOCIO]`, `[RAMO]`, `[SERVICO]`, `[OFERTA]`, `[HORARIO]`, `[ENDERECO]`, `[RESPONSAVEL]`, `[CANAL]`, `[LINK_AGENDAMENTO]`.

### Saudação
> Oi [NOME_CLIENTE]! 👋 Aqui é o atendimento do [NOME_NEGOCIO]. Vi sua mensagem e já estou aqui pra te ajudar. Me conta rapidinho: o que você está procurando hoje?

### Qualificação
> Show, [NOME_CLIENTE]! Pra eu te orientar do jeito certo, posso te fazer 2 perguntinhas rápidas? São coisas simples, sem compromisso.

### Apresentação
> No [NOME_NEGOCIO] a gente trabalha com [SERVICO_LISTA]. O que mais combina com você é [SERVICO]. Quer que eu te explique como funciona ou prefere já falar de horários?

### Preço
> Sobre valores: o [SERVICO] fica entre [FAIXA_PRECO]. O valor final depende de [VARIAVEL]. A melhor forma de fechar é a gente conversar — quer que eu marque uma [CONVERSA/AULA/CONSULTA]?

### Objeção
> Entendo perfeitamente, [NOME_CLIENTE]. Muita gente sente isso no começo. Posso te mostrar [SOLUCAO_ESPECIFICA] que pode mudar essa percepção?

### Agendamento
> Perfeito! Tenho esses horários disponíveis para [SERVICO]:
> 1️⃣ [HORARIO_1]
> 2️⃣ [HORARIO_2]
> 3️⃣ [HORARIO_3]
> Qual fica melhor pra você? Pode responder só com o número.

### Confirmação
> ✅ Pronto, [NOME_CLIENTE]! Você está marcado(a) para [SERVICO] em [DATA_HORA] no [ENDERECO]. Vou te lembrar 2h antes. Qualquer coisa, é só chamar.

### Lembrete
> Oi, [NOME_CLIENTE]! Faltam 2h pro seu [SERVICO] com [RESPONSAVEL] no [NOME_NEGOCIO]. Endereço: [ENDERECO]. Te espero! 🙌

### Pós-atendimento
> [NOME_CLIENTE], como foi sua experiência hoje? De 0 a 10, qual nota você dá?

### Follow-up
> Oi [NOME_CLIENTE], tudo bem? Notei que a gente parou de conversar. Ainda faz sentido te ajudar com [INTERESSE]?

### Reativação
> [NOME_CLIENTE]! Faz um tempo que a gente não fala. Tô passando rapidinho porque tem [OFERTA] rolando aqui no [NOME_NEGOCIO]. Quer saber mais?

### Atendimento humano (handoff)
> Beleza, [NOME_CLIENTE]. Vou te passar pro [RESPONSAVEL] agora mesmo. Em instantes alguém continua daqui. 🙏

### Notificação interna
> 🔥 *Lead quente — [NOME_NEGOCIO]*
> Cliente: [NOME_CLIENTE]
> Interesse: [INTERESSE]
> Canal: [CANAL]
> Última mensagem: "[ULTIMA_MENSAGEM]"
> Abrir conversa: [LINK_INBOX]

### Campanha
> Oi, [NOME_CLIENTE]! Estamos com [OFERTA] válida até [VALIDADE]. Quer aproveitar? Responda *SIM* que te explico tudo.
> *Se não quiser mais receber mensagens, responda SAIR.*

---

## 16. Código limpo e organização técnica

### Princípios (não-negociáveis)
- **Um módulo, uma responsabilidade.** Se o módulo precisa de mais de uma frase para descrever, ele faz coisa demais.
- **Baixo acoplamento.** Nenhum agente conhece outro agente diretamente. Tudo passa pelo Supervisor.
- **Configuração por cliente.** Zero `if (tenant === "academia")` no código. Configuração vive em dados.
- **Reuso de fluxos.** Fluxo de agendamento é o mesmo para clínica, barbearia ou consultoria — só muda a configuração.
- **Logs estruturados.** JSON com `tenant_id`, `conversation_id`, `event_type`, `actor`. Nada de `console.log("entrou aqui")`.
- **Tratamento de erros.** Toda chamada externa em try/catch com retry exponencial e fallback humano.
- **Segurança de credenciais.** Variáveis de ambiente + secret manager. **Nunca** em código ou Git.
- **Versionamento semântico** (SemVer) e changelog.
- **Testes mínimos:** unitário para regras críticas (roteamento, classificação de intenção, idempotência) e e2e para os 3 fluxos principais.
- **Documentação:** README do repositório + comentários só onde a intenção não é óbvia + ADRs para decisões importantes.

### Estrutura de pastas (Stack B/C — backend próprio)

```
atendly/
├─ src/
│  ├─ channels/              # Adaptadores de canal (WhatsApp, Instagram, ...)
│  │  ├─ whatsapp/
│  │  │  ├─ webhook.ts       # recebe da Meta
│  │  │  ├─ sender.ts        # envia para a Meta
│  │  │  └─ normalize.ts     # converte para formato interno
│  │  ├─ instagram/
│  │  └─ index.ts            # registra adaptadores
│  ├─ agents/                # Cada agente isolado
│  │  ├─ supervisor/
│  │  ├─ receptionist/
│  │  ├─ qualifier/
│  │  ├─ sales/
│  │  ├─ scheduler/
│  │  ├─ support/
│  │  ├─ knowledge/
│  │  ├─ notifier/
│  │  ├─ reactivation/
│  │  └─ billing/
│  ├─ workflows/             # Orquestrações cross-agent (ex.: campanha, follow-up)
│  ├─ integrations/          # Calendar, Pagamento, Sheets, etc.
│  ├─ services/              # Casos de uso (CRM, FAQ, Auth, Billing)
│  ├─ db/                    # Schema, migrations, repositórios
│  ├─ config/                # Tipagem da config por tenant + loaders
│  ├─ utils/                 # helpers puros (datas, strings, validação)
│  ├─ notifications/         # Motor de notificações + templates
│  ├─ admin/                 # Backend do painel (rotas autenticadas)
│  ├─ logs/                  # Logger + middleware de auditoria
│  └─ main.ts                # Bootstrap
├─ tests/
├─ migrations/
├─ docs/                     # ADRs, runbooks, onboarding técnico
├─ .env.example
└─ README.md
```

### Padrões aplicáveis
- **Hexagonal / Ports & Adapters** para isolar canais e integrações.
- **Strategy** para escolha de modelo LLM por tipo de tarefa.
- **Saga / Workflow** para fluxos longos (Temporal ou BullMQ para começar).
- **CQRS leve** se a leitura crescer muito (separar painel admin de operação).

### Disciplina de código (estilo Karpathy)
- Pensa antes de codar. Plano em papel ou comentário antes de qualquer função grande.
- Simplicity first: 80% de funcionalidade com 20% de código.
- Surgical changes: mudanças cirúrgicas, não refatorações por estética no meio de uma feature.
- Goal-driven: cada PR tem uma única intenção descrita no título.

---

## 17. Modelo de dados

Tabelas principais (Postgres / Supabase). Toda tabela carrega `tenant_id` (RLS habilitado).

### `clients` (os clientes da Atendly — as empresas)
| Campo | Tipo |
|-------|------|
| id | UUID PK |
| name | string |
| niche | string |
| description | text |
| logo_url | string |
| primary_color | string |
| onboarding_data | jsonb (perfil completo do nicho) |
| created_at, updated_at | timestamp |

### `users` (usuários do painel)
| id | UUID | tenant_id | UUID | name | email | role (admin/manager/agent/finance) | whatsapp_for_notifications | active |

### `channels` (conexões de canal por tenant)
| id | tenant_id | type (whatsapp/instagram/site) | identifier (número/handle) | credentials_ref | status | connected_at |

### `leads` (contatos / pessoas que conversam)
Ver seção 10 (campos completos).

### `conversations`
| id | tenant_id | lead_id | channel_id | status (open/idle/closed/human_required) | last_message_at | assigned_user_id | sentiment | priority |

### `messages`
| id | conversation_id | direction (in/out) | sender_type (lead/bot/human) | content | content_type (text/image/audio/template) | timestamp | external_id | meta (jsonb) |

### `services`
| id | tenant_id | name | description | price_min | price_max | duration_minutes | media[] | active |

### `offers`
| id | tenant_id | title | description | service_id (opcional) | valid_from | valid_until | conditions | active |

### `faqs`
Ver seção 11.

### `agents` (configuração de qual agente está ativo por tenant)
| id | tenant_id | agent_key | enabled | config (jsonb — tom de voz, regras específicas) |

### `workflows` (definições de fluxo customizadas)
| id | tenant_id | key | definition (jsonb / DSL) | active | version |

### `triggers` (matriz de gatilhos por tenant)
| id | tenant_id | event | conditions (jsonb) | agent_key | action | notification_rule_id |

### `notifications`
| id | tenant_id | rule_id | event_payload (jsonb) | recipient (string) | channel | template_id | status (queued/sent/delivered/failed) | error | sent_at |

### `appointments`
| id | tenant_id | lead_id | service_id | start_at | end_at | status (scheduled/confirmed/done/no_show/cancelled) | calendar_event_id | notes |

### `audit_logs`
| id | tenant_id | actor_type (user/bot/system) | actor_id | action | entity_type | entity_id | payload (jsonb) | created_at |

### `consent_records`
| id | tenant_id | lead_id | accepted | accepted_at | terms_version | source_message_id |

### Boas práticas de schema
- `tenant_id` em **todas** as tabelas operacionais.
- Postgres **RLS** habilitado por padrão.
- Índices em `(tenant_id, ...)` para todas as queries quentes.
- `audit_logs` append-only.
- Mensagens em tabela separada de conversas (cresce muito).
- Mídia em Storage (Supabase Storage / S3), não no banco.

---

## 18. Integrações possíveis

| Integração | Função | Quando usar | Dados que trafegam |
|------------|--------|-------------|--------------------|
| **WhatsApp Cloud API (Meta)** | Canal oficial WhatsApp | Sempre (obrigatório para escala) | Mensagens, templates, status de entrega |
| **WhatsApp via BSP (Gupshup, 360dialog)** | Gateway terceirizado oficial | Quando quiser delegar aprovação de templates | Igual ao Cloud API |
| **Instagram Graph API (Meta)** | DMs do Instagram | Sempre | Mensagens, mídia |
| **HubSpot / Pipedrive / RD Station** | CRM externo | Cliente já usa CRM | Lead, etapas, atividades |
| **Google Sheets** | "CRM" do MVP / exports | MVP rápido / clientes simples | Linhas de lead/atendimento |
| **Airtable** | CRM intermediário visual | Clientes que querem dashboard simples | Mesmo do Sheets, mais rico |
| **Google Calendar** | Agendamento | Padrão para agendamento | Eventos, disponibilidade |
| **Cal.com** | Agendamento avançado | Quando precisar regras complexas | Eventos, recursos |
| **Resend / SendGrid** | E-mail transacional | Notificações + recuperação de senha | Conteúdo + metadados |
| **n8n / Make / Zapier** | Orquestração de fluxos | Integrações esporádicas / clientes técnicos | Eventos diversos |
| **OpenAI / Anthropic** | Cérebro dos agentes | Sempre | Mensagens (cuidar PII) |
| **Postgres (Supabase)** | Persistência principal | Sempre | Tudo |
| **Stripe / Pagar.me / Asaas** | Pagamentos | Quando vender online via bot | Cobranças, status |
| **Webhooks genéricos** | Integração com qualquer sistema externo | Quando cliente tem ERP/CRM próprio | Eventos do Atendly |
| **Landing pages (Webflow, Framer, Next próprio)** | Captação | Sempre que houver tráfego pago | Formulário → webhook → CRM Atendly |

**Regra de ouro:** toda integração externa fica isolada num *adapter* com interface estável. Trocar provedor não deve quebrar o resto do código.

---

## 19. Passo a passo de implementação

### Etapa 1 — Definição do escopo (semana 0)
Definir nicho-piloto (sugestão: academia, por familiaridade), 1 cliente real para co-criar, e os 3 fluxos principais (primeiro contato, qualificação, agendamento).

### Etapa 2 — Escolha da stack
Para começar: **Stack A (n8n + Z-API + Sheets + OpenAI)** OU já partir para **Stack B (Next.js + Supabase + Cloud API)**.

### Etapa 3 — Onboarding do cliente
Criar formulário (Tally ou Typeform) com todos os campos da seção *entradas_que_o_sistema_deve_receber*. Saída = JSON estruturado no padrão da seção 7.

### Etapa 4 — Base de conhecimento
Importar FAQ do cliente, gerar embeddings, salvar no banco. Testar busca semântica com 30 perguntas reais.

### Etapa 5 — CRM
Criar tabelas + tela básica de lista de leads + ficha do lead.

### Etapa 6 — Canais
Conectar WhatsApp Cloud API (verificação de número, webhook). Conectar Instagram Graph (página + DMs).

### Etapa 7 — Agentes
Implementar pelo menos: Recepcionista, FAQ, Supervisor. Cada um com prompt isolado, ferramentas mínimas.

### Etapa 8 — Gatilhos
Matriz mínima da seção 6 com 5 gatilhos críticos (novo lead, dúvida, pedido de humano, fora de horário, reclamação).

### Etapa 9 — Notificações
Notificação para 1 número WhatsApp + 1 e-mail: "novo lead recebido".

### Etapa 10 — Painel administrativo
Telas mínimas: Login, Inbox, Leads, FAQ, Config.

### Etapa 11 — Atendimento manual
Botão "Assumir conversa" + "Devolver bot" + indicador visual de status.

### Etapa 12 — Testes
Lista da seção 20.

### Etapa 13 — Deploy
Vercel (front) + Railway/Render (backend) + Supabase (DB). Domínio próprio + SSL.

### Etapa 14 — Monitoramento
Sentry + Better Stack para uptime + dashboard simples no painel.

### Etapa 15 — Escala
Onboarding do 2º, 3º clientes. Cada novo cliente devolve aprendizados que viram features.

---

## 20. Testes antes do deploy

Checklist de QA antes de subir produção:

- [ ] Bot responde corretamente as 30 principais perguntas da FAQ.
- [ ] Bot responde "não sei, vou chamar alguém" quando não encontra na base.
- [ ] Agendamento cria evento no Google Calendar + envia confirmação.
- [ ] Lembrete dispara 2h antes corretamente.
- [ ] Notificação chega no WhatsApp do responsável em ≤ 30s.
- [ ] Notificação chega no e-mail do responsável em ≤ 1min.
- [ ] Pedido "quero falar com humano" pausa bot imediatamente.
- [ ] Atendente assume conversa → bot não responde mais.
- [ ] Consentimento é pedido na primeira mensagem.
- [ ] Comando *SAIR* remove contato de campanhas e registra opt-out.
- [ ] Falha simulada de Calendar não derruba conversa (fallback humano).
- [ ] Mensagem duplicada (mesmo `external_id`) não é processada 2x.
- [ ] Lead vindo do Instagram cria contato corretamente atrelado ao tenant.
- [ ] Lead vindo do WhatsApp cria contato corretamente atrelado ao tenant.
- [ ] Dois tenants diferentes (academia + clínica) respondem com tom e regras próprias.
- [ ] Cliente fora do horário recebe mensagem de fora do expediente.
- [ ] Backup do banco está rodando + restore foi testado uma vez.

---

## 21. Deploy e monitoramento

### Como publicar
- **Front (painel):** Vercel — deploy automático no push para `main`.
- **Backend:** Railway/Render/Fly.io — Docker + variáveis de ambiente.
- **DB:** Supabase gerenciado.
- **Filas:** Upstash Redis (serverless).
- **Storage:** Supabase Storage ou S3.
- **DNS + SSL:** Cloudflare.

### Como monitorar
- **Erros:** Sentry com contexto de `tenant_id` e `conversation_id`.
- **Uptime:** Better Stack (heartbeat dos webhooks + endpoints críticos).
- **Logs estruturados:** Axiom ou Logtail.
- **Métricas de negócio:** dashboard interno no painel + Metabase.

### Como acompanhar conversas
- Inbox unificada do painel.
- Filtros: aguardando humano, sem resposta há X, sentimento negativo.
- Atalhos de teclado para atendentes.

### Como revisar respostas ruins
- Toda conversa tem botão "👎 Resposta ruim" no painel.
- Cria entrada na fila de revisão.
- Revisão semanal: ajustar FAQ ou prompt do agente.

### Como atualizar a base de conhecimento
- CRUD direto no painel.
- Reembedding automático quando a resposta muda.
- Histórico de versões da FAQ.

### Como auditar notificações
- Tela "Logs de notificações": destinatário, canal, status (entregue/falhou), erro.
- Relatório semanal de entregabilidade.

### Como medir performance dos agentes
- Por agente: nº de conversas, % handoff, satisfação inferida, tempo médio de resposta, custo por conversa (tokens).
- Comparar versões de prompt (A/B).

---

## 22. Métricas de sucesso

### Funnel
- Leads capturados / dia.
- Taxa de resposta (% que respondem ao primeiro contato).
- Taxa de qualificação (% que completam qualificação).
- Taxa de agendamento.
- Comparecimento.
- Conversão final (lead → cliente).
- Receita potencial em pipeline.

### Operação
- Tempo médio de primeira resposta.
- Tempo médio de resolução.
- % de mensagens respondidas pelo bot (vs. humano).
- Intervenções humanas / total.
- Perguntas sem resposta na base.
- Reclamações abertas / semana.
- Opt-outs / mês.

### Saúde técnica
- Uptime do webhook.
- Falhas de integração / semana.
- Custo por atendimento (R$ em tokens + infra).
- Latência p95 das respostas.

### Cliente final
- NPS / CSAT por cliente Atendly.
- Reviews espontâneos pós-atendimento.

**Atendly como produto:**
- MRR.
- Churn mensal.
- LTV / CAC.
- Tempo até o primeiro "uau" do cliente (Time to Value).

---

## 23. Escala

### Crescer em clientes
- Onboarding self-service (cliente preenche e o sistema configura).
- Templates por nicho já prontos (academia, clínica, barbearia...).
- Documentação pública + central de ajuda.

### Crescer em nichos
- Cada nicho ganha um *preset* com FAQ, vocabulário e jornada base.
- Biblioteca de presets versionada.
- Cliente parte de um preset e customiza.

### Crescer em canais
- Adapter por canal (já desenhado modular).
- Próximos: Site widget, e-mail (Inbound), Telegram.

### Crescer em agentes
- Marketplace interno de agentes (cliente liga/desliga).
- Versão paga libera agentes avançados (cobrança, reativação).

### Multiunidades
- Hierarquia: `client` → `units` → `users`.
- Cada unidade pode ter agenda, equipe e até número WhatsApp próprio.

### Permissões por equipe
- RBAC: admin / gerente da unidade / atendente / financeiro / read-only.
- Auditoria de mudanças sensíveis.

### Templates por segmento
- "Pacotes prontos": Academia Bronze / Prata / Ouro.
- Cliente escolhe pacote, ajusta no painel, vai pra produção em 1 dia.

### Biblioteca de fluxos
- Fluxos reutilizáveis (agendamento, cobrança, reativação) versionados.
- Importar fluxo → ajustar variáveis.

### Analytics avançado
- Coortes de leads.
- Funis customizáveis.
- Comparação entre unidades / nichos.

### White label
- Domínio próprio do cliente.
- Marca/logo nas mensagens iniciais.
- Plano enterprise.

### Cobrança recorrente
- Stripe Billing / Asaas.
- Planos: Starter / Pro / Enterprise.
- Métricas: assentos, mensagens, canais.

### Marketplace de integrações
- Adapters publicáveis por parceiros.
- Cliente conecta integração com 1 clique.

---

## 24. Riscos e decisões importantes

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Dependência da API da Meta (WhatsApp/Instagram)** | Alta — TOS muda, números podem ser bloqueados | Usar Cloud API oficial; trabalhar com BSP confiável; nunca usar API não-oficial em escala |
| **Bloqueio do número de WhatsApp** | Crítico — paralisa cliente | Aquecer número, respeitar janela de 24h, evitar disparos em massa fora de template aprovado, opt-out claro |
| **LGPD** | Alto — multa, processo, reputação | Consentimento explícito, base legal documentada, DPO se necessário, política de privacidade pública, direito ao esquecimento implementado |
| **Alucinação da IA** | Médio — informação errada vira problema | Respostas críticas (preço, horário, regra) saem da base estruturada, não do LLM; threshold de confiança; fallback humano |
| **Respostas erradas em escala** | Médio — perda de confiança | Revisão semanal das conversas marcadas; testes de regressão automáticos das FAQs principais |
| **Excesso de automação** | Médio — robotização da relação | Tom humano nas mensagens; humano disponível em 1 clique; pesquisa de satisfação |
| **Falta de manutenção da base** | Alto — base envelhece e bot piora | Alerta ao admin quando uma FAQ tem queda de score; relatório mensal de "perguntas órfãs" |
| **Custo de mensagens (Meta + LLM)** | Médio — pode comer margem | Cache de respostas frequentes; roteamento por custo (Haiku/GPT-mini para tarefas simples); monitor de custo por tenant |
| **Escalabilidade** | Médio — gargalo no banco/fila | Multi-tenant bem isolado; índices certos; filas com priorização; circuit breakers |
| **Vazamento de dados entre tenants** | Crítico — fim do produto | RLS no Postgres + revisão obrigatória de qualquer query que toque múltiplos tenants + testes específicos |
| **Atraso na primeira resposta** | Alto — quebra promessa do produto | SLA interno de 30s; alarme se latência sobe |
| **Cliente abandona porque painel é confuso** | Médio — churn | UX testada com usuários reais antes de cada release |
| **Falta de suporte ao cliente Atendly** | Alto — churn por frustração | Canal Atendly-Atendly: o próprio produto atende os clientes do produto |

---

## 25. Checklist final de implantação

**Pré-implantação**
- [ ] Definição clara do nicho-piloto.
- [ ] 1 cliente-âncora confirmado.
- [ ] Conta Meta Business verificada.
- [ ] Número de WhatsApp dedicado e oficializado.
- [ ] Conta Instagram Business conectada à página do Facebook.
- [ ] Conta no provedor LLM (Anthropic/OpenAI) com billing.
- [ ] Domínio + e-mail corporativo do cliente.
- [ ] Política de privacidade publicada + termos de uso.

**Configuração**
- [ ] Onboarding do cliente preenchido (todos os campos).
- [ ] FAQ importada e revisada.
- [ ] Serviços/produtos cadastrados.
- [ ] Ofertas configuradas.
- [ ] Horários e exceções definidos.
- [ ] Equipe cadastrada + permissões atribuídas.
- [ ] Lista de notificação configurada.
- [ ] Regras de escalonamento humano definidas.
- [ ] Frases proibidas e casos sensíveis listados.

**Técnico**
- [ ] WhatsApp Cloud API conectado e testado.
- [ ] Instagram Graph conectado e testado.
- [ ] Banco de dados provisionado (Supabase).
- [ ] RLS habilitado em todas as tabelas.
- [ ] Backups automáticos verificados.
- [ ] Sentry + Better Stack configurados.
- [ ] Variáveis de ambiente protegidas (sem segredo em Git).
- [ ] Deploy do painel em produção.
- [ ] Webhook idempotente (não processa mensagem 2x).

**Testes**
- [ ] Todas as 30 perguntas de FAQ respondidas corretamente.
- [ ] Fluxo de agendamento end-to-end OK.
- [ ] Handoff humano funciona dos dois lados.
- [ ] Notificações chegando em ≤ 1min.
- [ ] Mensagem fora do horário comporta-se corretamente.
- [ ] Opt-out funciona e é registrado.
- [ ] Dois tenants distintos não se misturam.

**Operacional**
- [ ] Equipe do cliente treinada no painel.
- [ ] Documentação de uso entregue ao cliente.
- [ ] Canal de suporte Atendly aberto.
- [ ] Rotina de revisão semanal definida.
- [ ] Métricas iniciais sendo medidas.

---

## 26. Entregáveis finais

### Arquitetura resumida
Atendly = orquestrador multi-tenant de agentes de IA conversando por canais (WhatsApp/Instagram primeiro) sobre uma base de conhecimento configurada por cliente, com handoff humano, notificações multicanal, CRM próprio e painel administrativo. Stack inicial: **Next.js + Supabase + WhatsApp Cloud API + Anthropic/OpenAI + n8n** para fluxos visuais auxiliares.

### Stack recomendada para começar
**Stack B (Híbrida)**:
- Next.js (TypeScript) — painel + APIs.
- Supabase — Postgres + Auth + Storage + Realtime.
- WhatsApp Cloud API (oficial Meta) + Instagram Graph API.
- Anthropic (Claude) ou OpenAI para os agentes; LangGraph para orquestração.
- Upstash Redis para sessão e fila leve.
- Resend para e-mail.
- Sentry + Better Stack para observabilidade.
- Vercel + Railway para deploy.
- n8n self-host para fluxos visuais auxiliares (notificações, integrações de terceiros, presets de campanha).

### Roteiro de implantação em 30 dias

**Semana 1 — Fundação**
- Dias 1–2: setup técnico (repo, Supabase, Vercel, contas Meta).
- Dias 3–4: schema do banco + autenticação do painel.
- Dias 5–7: conexão WhatsApp Cloud API + recepção de mensagem + persistência básica.

**Semana 2 — Cérebro**
- Dias 8–10: Agente Recepcionista + Agente Supervisor + integração com LLM.
- Dias 11–12: Base de conhecimento + busca semântica (pgvector).
- Dias 13–14: Agente FAQ funcional + testes com cliente-âncora.

**Semana 3 — Operação**
- Dias 15–17: Painel admin (Inbox, Leads, FAQ, Config).
- Dias 18–19: Handoff humano + pausa/retomada do bot.
- Dias 20–21: Notificações WhatsApp + e-mail.

**Semana 4 — Polimento**
- Dias 22–23: Agendamento via Google Calendar.
- Dias 24–25: Onboarding (formulário + provisionamento).
- Dias 26–27: QA completo da seção 20.
- Dias 28–29: Subida em produção + treinamento do cliente-âncora.
- Dia 30: Operação assistida + coleta de feedback do dia 1.

### Modelo de onboarding do cliente
Formulário com seções: **Negócio** (nome, ramo, descrição, público, regras), **Canais** (WhatsApp, Instagram, e-mail, site), **Localização** (endereço, unidades, horários), **Catálogo** (serviços, preços/faixas, ofertas), **Equipe** (responsáveis + números/e-mails para notificação), **Atendimento** (FAQ inicial, casos que exigem humano, frases proibidas, tom de voz), **Objetivo** (captar lead / vender / agendar / suportar / reativar / cobrar / informar), **LGPD** (texto de consentimento aprovado, política de privacidade).

### Modelo de tabela de leads
Ver seção 10 — 22 campos cobrindo dados pessoais, origem, status, funil, consentimento, próximas ações, valor e motivo de perda.

### Modelo de tabela de FAQ
Ver seção 11 — categoria, pergunta, variações, resposta curta/completa, links, tags, nicho, embeddings, responsável, atualização.

### Modelo de agentes
Catálogo de 10 agentes especializados — ver seção 5 — cada um com função, entradas, saídas, gatilhos, condição de handoff e dados a salvar.

### Modelo de gatilhos
Matriz com 15 gatilhos cobrindo novo lead, preço, agendamento, dúvida, reclamação, sem-resposta, lead quente, cliente atual, cancelamento, pagamento, evento, fora de horário, pedido de humano, falha de integração e no-show — ver seção 6.

### Modelo de notificações
Tabela de 10 eventos prontos para configuração imediata — ver seção 14 — com destinatário, canal, gabarito de mensagem.

### Modelo de fluxo universal de atendimento
Esqueleto de 8 etapas (mensagem → router → consentimento → pausa do bot → horário → classificação → agente → resposta + log) — ver seção 9 — adaptável a qualquer nicho ou canal.

### Próximos passos para transformar isso em produto vendável

1. **Validar com 1 cliente real** (semana 1–4): co-criar o piloto, ganhar caso de uso.
2. **Documentar tudo** (semana 4): vídeo de demo + página de vendas + tabela de planos.
3. **Empacotar 3 presets de nicho** (mês 2): academia, clínica, barbearia. Cada um vira oferta pronta.
4. **Cobrar setup + mensalidade**: setup paga o custo de implantação, mensalidade é o motor.
5. **Coletar depoimentos e métricas** dos primeiros clientes: ROI claro vende sozinho.
6. **Vender 1:1 nos primeiros 10 clientes**, presencial ou via DM no Instagram da Atendly.
7. **Construir ICP (Ideal Customer Profile)** com base nos 10 primeiros — quem fecha rápido, fica e indica.
8. **Investir em SEO + conteúdo** no nicho que melhor performou.
9. **Migrar para self-service** quando o onboarding estiver tão simples que o cliente faz sozinho.
10. **Abrir programa de parceiros** (agências, integradores) para escalar a captação sem inflar o time comercial.

---

> **Atendly — atendimento que conversa, qualifica e converte.**
>
> Este documento é o ponto de partida. A cada cliente implantado, atualize as seções 6, 7, 9 e 11 com aprendizados de campo. A cada nicho novo, crie um preset. A cada falha relevante, registre uma ADR em `docs/adrs/`.
>
> *O produto evolui na velocidade que o aprendizado é registrado.*
