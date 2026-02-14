import { useState, useRef, useEffect } from "react";
import {
  Bot, Send, Calendar, TrendingUp, AlertTriangle, BarChart3,
  GitCompare, FileText, Loader2, Sparkles, Paperclip, X, Image, FileSpreadsheet,
  Database, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { useChatFileUpload, FileAttachment } from "@/hooks/useChatFileUpload";
import { supabase } from "@/integrations/supabase/client";
import { detectModule, mapRows, ImportModule } from "@/data/importModules";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  displayContent?: string;
  attachments?: Array<{ name: string; type: string; previewUrl?: string }>;
  excelData?: { rows: Record<string, any>[]; headers: string[]; fileName: string }[];
}

const quickActions = [
  { icon: Calendar, label: "Prioridades do dia", prompt: "Quais são as prioridades do dia para a gestão da frota?" },
  { icon: TrendingUp, label: "Top 20 veículos caros", prompt: "Quais são os top 20 veículos mais caros do mês e seus motivos?" },
  { icon: AlertTriangle, label: "30 veículos críticos", prompt: "Liste os 30 veículos mais críticos e sugira um plano de ação para cada." },
  { icon: BarChart3, label: "Plano redução 8%", prompt: "Crie um plano para reduzir o custo total da frota em 8% nos próximos 90 dias." },
  { icon: GitCompare, label: "Comparar unidades", prompt: "Compare a unidade Matriz SP vs Filial RJ em custo/km, consumo médio e veículos parados." },
  { icon: FileText, label: "Relatório diretoria", prompt: "Gere um relatório executivo mensal para apresentação à diretoria." },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openrouter-chat`;

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [importingIndex, setImportingIndex] = useState<number | null>(null);
  const [importedIndices, setImportedIndices] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const {
    attachments, isUploading, fileInputRef,
    handleFiles, removeAttachment, clearAttachments,
    buildMessageContent, getImageUrls, getExcelAttachments,
  } = useChatFileUpload();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDistributeData = async (msgIndex: number, excelItem: { rows: Record<string, any>[]; headers: string[]; fileName: string }) => {
    const mod = detectModule(excelItem.headers);
    if (!mod) {
      toast.error(`Não foi possível detectar a categoria dos dados de "${excelItem.fileName}". Use a página Importar Dados para mapeamento manual.`);
      return;
    }

    setImportingIndex(msgIndex);
    try {
      const { dbRows } = mapRows(excelItem.rows, mod);
      if (dbRows.length === 0) {
        toast.error(`Nenhum registro válido encontrado para ${mod.label}.`);
        setImportingIndex(null);
        return;
      }

      const errors: string[] = [];
      const batchSize = 100;
      for (let i = 0; i < dbRows.length; i += batchSize) {
        const batch = dbRows.slice(i, i + batchSize);
        const { error } = await supabase.from(mod.table as any).upsert(batch as any);
        if (error) errors.push(error.message);
      }

      queryClient.invalidateQueries();

      if (errors.length === 0) {
        toast.success(`${dbRows.length} registros importados em "${mod.label}" com sucesso!`);
        setImportedIndices(prev => new Set(prev).add(msgIndex));
      } else {
        toast.error(`Importação parcial: ${errors.length} erro(s). ${dbRows.length - errors.length} registros OK.`);
      }
    } catch (err: any) {
      toast.error(`Erro ao importar: ${err.message}`);
    }
    setImportingIndex(null);
  };

  const sendMessage = async (text: string) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;

    const imageUrls = getImageUrls();
    const excelAtts = getExcelAttachments();
    const finalText = buildMessageContent(text);

    let apiContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    if (imageUrls.length > 0) {
      apiContent = [
        { type: "text", text: finalText },
        ...imageUrls.map((url) => ({ type: "image_url" as const, image_url: { url } })),
      ];
    } else {
      apiContent = finalText;
    }

    const userMsg: Message = {
      role: "user",
      content: apiContent,
      displayContent: text,
      attachments: attachments.map((a) => ({ name: a.name, type: a.type, previewUrl: a.previewUrl })),
      excelData: excelAtts.map((a) => ({ rows: a.rawRows!, headers: a.headers!, fileName: a.name })),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    clearAttachments();
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) toast.error("Limite de requisições atingido. Aguarde 1 minuto.");
        else if (resp.status === 402) toast.error("Créditos esgotados.");
        else toast.error(`Erro ${resp.status} — Falha ao conectar com a IA.`);
        setIsLoading(false);
        return;
      }

      if (!resp.body) { toast.error("Sem resposta do servidor"); setIsLoading(false); return; }

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
          if (jsonStr === "[DONE]") { streamDone = true; break; }
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

      if (!assistantSoFar) upsertAssistant("Desculpe, não consegui gerar uma resposta. Tente novamente.");
    } catch (e) {
      console.error("Chat error:", e);
      toast.error("Erro ao conectar com a IA. Tente novamente.");
    }
    setIsLoading(false);
  };

  const getDisplayText = (msg: Message): string => {
    if (msg.displayContent) return msg.displayContent;
    if (typeof msg.content === "string") return msg.content;
    const textPart = msg.content.find((p) => p.type === "text");
    return textPart?.text || "";
  };

  const renderFileIcon = (type: string) => {
    switch (type) {
      case "image": return <Image className="h-3 w-3" />;
      case "excel": return <FileSpreadsheet className="h-3 w-3" />;
      case "pdf": return <FileText className="h-3 w-3" />;
      default: return <Paperclip className="h-3 w-3" />;
    }
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
            <p className="text-xs text-muted-foreground">Analista Sênior de Frota — GPT-5 Mini (OpenRouter)</p>
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
                  <button key={action.label} onClick={() => sendMessage(action.prompt)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left hover:bg-muted/50 transition-colors group">
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
                : "bg-card border border-border text-card-foreground rounded-bl-md"}`}>

              {/* Attachment previews */}
              {msg.role === "user" && msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {msg.attachments.map((att, j) => (
                    <div key={j}>
                      {att.type === "image" && att.previewUrl ? (
                        <img src={att.previewUrl} alt={att.name} className="max-h-32 rounded-lg" />
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/20 px-2 py-1 text-xs">
                          {renderFileIcon(att.type)}
                          <span className="truncate max-w-[120px]">{att.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none text-card-foreground [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ol]:space-y-2 [&_li]:leading-relaxed [&_strong]:text-foreground [&_blockquote]:border-l-2 [&_blockquote]:border-info [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_em]:text-muted-foreground">
                  {getDisplayText(msg).split('\n').map((line, j) => {
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
                <p className="whitespace-pre-wrap">{getDisplayText(msg)}</p>
              )}

              {/* Distribute data button for user messages with Excel */}
              {msg.role === "user" && msg.excelData && msg.excelData.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.excelData.map((excelItem, j) => {
                    const detectedMod = detectModule(excelItem.headers);
                    const isImported = importedIndices.has(i);
                    const isCurrentlyImporting = importingIndex === i;

                    return (
                      <div key={j} className="flex items-center gap-2">
                        {isImported ? (
                          <div className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/20 px-3 py-1.5 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Importado em {detectedMod?.label || "?"}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDistributeData(i, excelItem)}
                            disabled={isCurrentlyImporting}
                            className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30 px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {isCurrentlyImporting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Database className="h-3.5 w-3.5" />
                            )}
                            <span>
                              {detectedMod
                                ? `Importar ${excelItem.rows.length} registros → ${detectedMod.label}`
                                : `Distribuir dados (${excelItem.rows.length} linhas)`}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
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

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="border-t border-border bg-muted/30 px-4 py-2">
          <div className="flex flex-wrap gap-2 max-w-4xl mx-auto">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
                {att.type === "image" && att.previewUrl ? (
                  <img src={att.previewUrl} alt={att.name} className="h-8 w-8 rounded object-cover" />
                ) : renderFileIcon(att.type)}
                <span className="truncate max-w-[120px] text-foreground">{att.name}</span>
                <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2 max-w-4xl mx-auto">
          <input type="file" ref={fileInputRef} className="hidden" multiple
            accept=".jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls,.csv,.pdf"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isUploading}
            className="rounded-xl border border-input bg-background p-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30"
            title="Anexar arquivo (Excel, PDF, Imagem)">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre a frota..."
            className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading} />
          <button type="submit" disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className="rounded-xl bg-primary p-3 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
