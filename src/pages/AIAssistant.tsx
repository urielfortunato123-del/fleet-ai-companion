import { useState, useRef, useEffect } from "react";
import {
  Bot, Send, Calendar, TrendingUp, AlertTriangle, BarChart3,
  GitCompare, FileText, Loader2, Sparkles
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickActions = [
  { icon: Calendar, label: "Prioridades do dia", prompt: "Quais são as prioridades do dia para a gestão da frota?" },
  { icon: TrendingUp, label: "Top 20 veículos caros", prompt: "Quais são os top 20 veículos mais caros do mês e seus motivos?" },
  { icon: AlertTriangle, label: "30 veículos críticos", prompt: "Liste os 30 veículos mais críticos e sugira um plano de ação para cada." },
  { icon: BarChart3, label: "Plano redução 8%", prompt: "Crie um plano para reduzir o custo total da frota em 8% nos próximos 90 dias." },
  { icon: GitCompare, label: "Comparar unidades", prompt: "Compare a unidade Matriz SP vs Filial RJ em custo/km, consumo médio e veículos parados." },
  { icon: FileText, label: "Relatório diretoria", prompt: "Gere um relatório executivo mensal para apresentação à diretoria." },
];

const mockResponses: Record<string, string> = {
  "Quais são as prioridades do dia para a gestão da frota?": `## 🔴 Prioridades do Dia — 14/02/2026

### Ações Imediatas (Críticas)
1. **Preventiva vencida — AAB3C12** (Fiat Strada 2022, Matriz SP)
   - 12.000 km excedidos desde a última troca de óleo
   - **Ação:** Agendar OS preventiva emergencial hoje
   - *Fonte: work_orders, odometer_logs*

2. **CNH vencida — Carlos Silva**
   - Vencimento: 01/02/2026 (13 dias atrás)
   - Veículo vinculado: AAB3C12
   - **Ação:** Suspender atribuição e notificar RH
   - *Fonte: drivers, assignments*

### Alta Prioridade
3. **Consumo anômalo — BBD5E67** (4.2 km/l vs média 7.1)
   - Possível vazamento ou uso indevido
   - **Ação:** Solicitar inspeção mecânica
   
4. **3 CRLVs vencendo em 5 dias**
   - Veículos: CCF7G89, DDH9I01, EEJ1K23
   - **Ação:** Encaminhar renovação imediata

### Média Prioridade
5. **12 rodízios de pneus atrasados** — Agendar para esta semana
6. **Veículo EEJ1K23 parado há 30+ dias** — Avaliar destinação

> **Confiança:** Alta (95%) — Dados completos para todos os itens.`,

  "default": `## Análise em Processamento

Estou analisando os dados da frota para responder sua solicitação. Em um sistema completo, eu consultaria diretamente o banco de dados PostgreSQL para trazer informações precisas e atualizadas.

### O que eu faria:
1. Consultaria as tabelas relevantes (vehicles, work_orders, fuel_logs, etc.)
2. Aplicaria os filtros e cálculos necessários
3. Geraria uma resposta com evidências e recomendações

> **Nota:** Esta é uma demonstração. Em produção, as respostas serão baseadas em dados reais via RAG/SQL tool.

*Fonte: Demonstração — dados mock*`
};

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulate response
    await new Promise(r => setTimeout(r, 1500));
    
    const response = mockResponses[text] || mockResponses["default"];
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
            <Bot className="h-5 w-5 text-info" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Assistente IA</h1>
            <p className="text-xs text-muted-foreground">Analista Sênior de Frota — consulta dados reais</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-info/10">
              <Sparkles className="h-8 w-8 text-info" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">Como posso ajudar?</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Sou seu analista sênior de frota. Consulto os dados reais do sistema
                para gerar relatórios, priorizar ações e recomendar melhorias.
              </p>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-2xl">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left hover:bg-muted/50 transition-colors group"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-info transition-colors shrink-0" />
                    <span className="text-xs font-medium text-foreground">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-in`}>
            <div className={`max-w-[85%] lg:max-w-[70%] rounded-2xl px-4 py-3 text-sm
              ${msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card border border-border text-card-foreground rounded-bl-md"}`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none text-card-foreground [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ol]:space-y-2 [&_li]:leading-relaxed [&_strong]:text-foreground [&_blockquote]:border-l-2 [&_blockquote]:border-info [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_em]:text-muted-foreground">
                  {msg.content.split('\n').map((line, j) => {
                    if (line.startsWith('## ')) return <h2 key={j}>{line.replace('## ', '')}</h2>;
                    if (line.startsWith('### ')) return <h3 key={j}>{line.replace('### ', '')}</h3>;
                    if (line.startsWith('> ')) return <blockquote key={j}><p>{line.replace('> ', '')}</p></blockquote>;
                    if (line.startsWith('- ')) return <p key={j} className="pl-3">• {line.replace('- ', '')}</p>;
                    if (line.match(/^\d+\./)) return <p key={j}>{line.replace(/\*\*(.*?)\*\*/g, '').trim() ? line : ''}</p>;
                    if (line.trim() === '') return <br key={j} />;
                    return <p key={j} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />;
                  })}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-slide-in">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-info animate-spin" />
              <span className="text-xs text-muted-foreground">Analisando dados da frota...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre a frota..."
            className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-xl bg-primary p-3 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
