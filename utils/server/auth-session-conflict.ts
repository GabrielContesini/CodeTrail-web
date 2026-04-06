import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const DEFAULT_AUTH_CONFLICT_MESSAGE =
  "Encontramos uma conta existente do CodeTrail com este e-mail. Entre usando o método original dessa conta para recuperar o acesso.";

type ProfileIdentityRow = {
  id: string;
  email: string | null;
};

export const EXISTING_ACCOUNT_CONFLICT_MESSAGE = DEFAULT_AUTH_CONFLICT_MESSAGE;

export async function findExistingAccountConflict(options: {
  currentUserId: string;
  email: string | null | undefined;
}) {
  const normalizedEmail = normalizeEmail(options.email);
  if (!normalizedEmail) {
    return null;
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return null;
  }

  const { data: currentProfile, error: currentProfileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", options.currentUserId)
    .maybeSingle();

  if (currentProfileError || currentProfile) {
    return null;
  }

  const { data: matchingProfiles, error: matchingProfilesError } = await adminClient
    .from("profiles")
    .select("id, email")
    .ilike("email", normalizedEmail)
    .limit(5);

  if (matchingProfilesError || !matchingProfiles?.length) {
    return null;
  }

  const conflictingProfile = (matchingProfiles as ProfileIdentityRow[]).find((profile) => {
    return (
      profile.id !== options.currentUserId &&
      normalizeEmail(profile.email) === normalizedEmail
    );
  });

  if (!conflictingProfile) {
    return null;
  }

  return {
    email: normalizedEmail,
    conflictingProfileId: conflictingProfile.id,
    message: EXISTING_ACCOUNT_CONFLICT_MESSAGE,
  };
}

function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.PRODUCT_SUPABASE_URL?.trim();
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.PRODUCT_SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}
