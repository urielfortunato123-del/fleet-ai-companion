import { useState, useRef, useEffect } from "react";
import {
  Bot, Send, Calendar, TrendingUp, AlertTriangle, BarChart3,
  GitCompare, FileText, Loader2, Sparkles, KeyRound, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";

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

const LM_STUDIO_URL = "http://192.168.1.119:1234/v1/chat/completions";

const SYSTEM_PROMPT = `Você é o FrotaSênior AI, um analista sênior de gestão de frotas com 20 anos de experiência.
Você ajuda gestores a tomar decisões inteligentes sobre manutenção, custos, consumo e otimização da frota.
Responda sempre em português brasileiro, de forma objetiva e com dados quando possível.
Use formatação markdown para organizar suas respostas.`;

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("lmstudio_api_key") || "");
  const [showKey, setShowKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey.trim()) {
        headers["Authorization"] = `Bearer ${apiKey.trim()}`;
        localStorage.setItem("lmstudio_api_key", apiKey.trim());
      }

      const resp = await fetch(LM_STUDIO_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "gemma-3-4b",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...updatedMessages.map(m => ({ role: m.role, content: m.content })),
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!resp.ok) {
        toast.error(`Erro ${resp.status} — Verifique se o LM Studio está rodando em localhost:1234`);
        setIsLoading(false);
        return;
      }

      if (!resp.body) {
        toast.error("Sem resposta do servidor");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

      // If no content was streamed, show fallback
      if (!assistantSoFar) {
        upsertAssistant("Desculpe, não consegui gerar uma resposta. Tente novamente.");
      }
    } catch (e) {
      console.error("Chat error:", e);
      toast.error("Erro ao conectar com o LM Studio. Verifique se está rodando em localhost:1234.");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
              <Bot className="h-5 w-5 text-info" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Assistente IA</h1>
              <p className="text-xs text-muted-foreground">Analista Sênior de Frota — LM Studio (local)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key"
                className="w-40 rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
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
                Sou seu analista sênior de frota com IA integrada.
                Consulto dados e gero relatórios, priorizo ações e recomendo melhorias.
              </p>
            </div>

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
                    if (line.match(/^\d+\./)) return <p key={j}>{line}</p>;
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

        {isLoading && !messages[messages.length - 1]?.content && (
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
