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
    const groupId = url.searchParams.get("groupId") || "group-120363429239267932-group";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    let query = supabase
      .from("raw_messages")
      .select("*", { count: "exact" })
      .eq("group_id", groupId)
      .order("message_timestamp", { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte("message_timestamp", `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte("message_timestamp", `${endDate}T23:59:59.999`);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({
        messages: data || [],
        count: count || 0,
        groupId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        messages: [],
        count: 0,
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
