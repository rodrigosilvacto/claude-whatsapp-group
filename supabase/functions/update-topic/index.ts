import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const topicId = url.pathname.split("/").pop();
    const { status } = await req.json();

    if (!topicId || !status) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios ausentes" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (status !== "approved" && status !== "rejected" && status !== "cancelled") {
      return new Response(JSON.stringify({ error: "Status inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, supabaseKey);

    // Cancelar/rejeitar remove o tópico da listagem
    if (status === "rejected" || status === "cancelled") {
      const { error } = await supabase.from("summarized_topics").delete().eq("id", topicId);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, deleted: true, id: topicId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data, error } = await supabase
      .from("summarized_topics")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", topicId)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, topic: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("Erro:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
