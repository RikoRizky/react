// supabase/functions/cleanup-orders/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Hapus semua order yang statusnya pending lebih dari 1 jam
  const { error } = await supabase
    .from("orders")
    .delete()
    .lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .eq("status", "pending");

  if (error) {
    console.error("Cleanup error:", error);
    return new Response(JSON.stringify({ success: false, error }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
