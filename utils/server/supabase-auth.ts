import { createClient as createSupabaseClient, type User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export interface AuthenticatedServerContext {
  accessToken: string;
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>> | null;
}

export async function requireAuthenticatedServerContext(
  request?: Request,
): Promise<AuthenticatedServerContext> {
  const headerToken = readBearerToken(request);
  if (headerToken) {
    const user = await getUserFromAccessToken(headerToken);
    return {
      accessToken: headerToken,
      user,
      supabase: null,
    };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!userData.user) {
    throw new Error("Unauthorized request.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const accessToken = sessionData.session?.access_token ?? null;
  if (!accessToken) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  return {
    accessToken,
    user: userData.user,
    supabase,
  };
}

function readBearerToken(request?: Request) {
  const rawHeader =
    request?.headers.get("x-supabase-auth") ??
    request?.headers.get("authorization");

  if (!rawHeader) {
    return null;
  }

  const matches = rawHeader.match(/^Bearer\s+(.+)$/i);
  return matches?.[1]?.trim() || null;
}

async function getUserFromAccessToken(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const userClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) {
    throw new Error("Unauthorized request.");
  }

  return data.user;
}
