import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const groupId = url.searchParams.get("groupId");
    const status = url.searchParams.get("status") || "all";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    if (!groupId) {
      return new Response(JSON.stringify({ error: "Parâmetro groupId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Listagem padrão: apenas pendentes e aprovados (cancelados/rejeitados não aparecem)
    let query = supabase
      .from("summarized_topics")
      .select("*")
      .eq("group_id", groupId)
      .in("status", ["pending", "approved"]);

    if (status === "pending" || status === "approved") {
      query = query.eq("status", status);
    }

    if (startDate && endDate) {
      query = query.gte("date_discussed", startDate).lte("date_discussed", endDate);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify({ topics: data || [] }), {
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
