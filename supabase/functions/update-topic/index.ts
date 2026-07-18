import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const topicId = url.pathname.split("/").pop();

    if (!topicId) {
      return new Response(
        JSON.stringify({ error: "Missing topic ID in URL" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { status } = await req.json();

    if (!["approved", "rejected"].includes(status)) {
      return new Response(JSON.stringify({ error: "Invalid status" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("summarized_topics")
      .update({
        status,
        approved_at: new Date(),
      })
      .eq("id", topicId)
      .select();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, topic: data?.[0] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error updating topic:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update topic" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
