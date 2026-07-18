import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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
      return new Response(
        JSON.stringify({ error: "Missing parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const updateData: any = { status };
    if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("summarized_topics")
      .update(updateData)
      .eq("id", topicId)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, topic: data }),
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
