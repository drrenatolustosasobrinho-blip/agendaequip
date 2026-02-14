import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { bootstrapPassword, adminEmail, adminPassword } = await req.json();

    // 1) Validar bootstrap password
    const expectedPassword = Deno.env.get('BOOTSTRAP_PASSWORD');
    if (!expectedPassword || bootstrapPassword !== expectedPassword) {
      return new Response(JSON.stringify({ error: 'Invalid bootstrap password' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Criar Supabase client com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 3) Verificar se setup já foi feito
    const { data: config, error: configError } = await supabase
      .from('app_config')
      .select('setup_done')
      .eq('id', 1)
      .single();

    if (configError && configError.code !== 'PGRST116') {
      throw new Error('Config fetch error: ' + configError.message);
    }

    if (config?.setup_done) {
      return new Response(JSON.stringify({ error: 'Setup already completed' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4) Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (authError) {
      throw new Error('Auth create user error: ' + authError.message);
    }

    const adminUserId = authData.user.id;

    // 5) Inserir na tabela admins
    const { error: insertAdminError } = await supabase
      .from('admins')
      .insert({ user_id: adminUserId });

    if (insertAdminError) {
      // Rollback: deletar usuário criado
      await supabase.auth.admin.deleteUser(adminUserId);
      throw new Error('Failed to assign admin role: ' + insertAdminError.message);
    }

    // 6) Marcar setup como completo
    await supabase
      .from('app_config')
      .update({ setup_done: true })
      .eq('id', 1);

    return new Response(JSON.stringify({ ok: true, message: 'Admin setup completed' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected error: ' + err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
