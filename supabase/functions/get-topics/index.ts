import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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
      return new Response(
        JSON.stringify({ error: "Missing groupId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let query = supabase
      .from("summarized_topics")
      .select("*")
      .eq("group_id", groupId);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (startDate && endDate) {
      query = query.gte("date_discussed", startDate).lte("date_discussed", endDate);
    }

    const { data, error } = await query.order("date_discussed", { ascending: false });

    if (error) throw error;

    return new Response(
      JSON.stringify({ topics: data || [] }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
