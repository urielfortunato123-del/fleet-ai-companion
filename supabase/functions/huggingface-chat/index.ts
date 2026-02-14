import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const HF_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY");
    if (!HF_API_KEY) {
      throw new Error("HUGGINGFACE_API_KEY is not configured");
    }

    const { messages, model } = await req.json();

    const systemPrompt = `Você é o FrotaSênior AI, um analista sênior de gestão de frotas de veículos. 
Você ajuda gestores de frota com análises, relatórios, recomendações de manutenção, otimização de custos, controle de combustível, pneus, multas e motoristas.
Responda sempre em português brasileiro. Use markdown para formatar suas respostas.
Seja direto, profissional e baseado em dados quando possível.`;

    const hfMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Models to try in order of preference
    const modelsToTry = model 
      ? [model] 
      : [
          "Qwen/Qwen2.5-72B-Instruct",
          "meta-llama/Llama-3.1-8B-Instruct",
          "mistralai/Mistral-7B-Instruct-v0.3",
          "microsoft/Phi-3-mini-4k-instruct",
        ];

    let lastError = "";

    for (const hfModel of modelsToTry) {
      // Use the new router endpoint
      const url = `https://router.huggingface.co/hf-inference/models/${hfModel}/v1/chat/completions`;
      
      console.log(`Trying model: ${hfModel} at ${url}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: hfModel,
          messages: hfMessages,
          max_tokens: 2048,
          stream: true,
        }),
      });

      if (response.ok) {
        console.log(`Success with model: ${hfModel}`);
        return new Response(response.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      const errorText = await response.text();
      lastError = `${hfModel}: ${response.status} - ${errorText.slice(0, 150)}`;
      console.log(`Model ${hfModel} failed: ${response.status}`);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "API key inválida ou sem permissão." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes na Hugging Face. Verifique seu plano." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: `Nenhum modelo disponível. Último erro: ${lastError}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("huggingface-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
