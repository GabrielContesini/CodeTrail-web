import { NextResponse } from "next/server";
import { loadSkillThreeLeaderboard } from "@/utils/server/skillthree-leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_CACHE_CONTROL = "private, no-store, max-age=0, must-revalidate";

export async function GET() {
  try {
    const payload = await loadSkillThreeLeaderboard();
    return jsonResponse(payload, { status: 200 });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar o ranking do SkillThree.",
      },
      { status: 401 },
    );
  }
}

function jsonResponse(body: unknown, options: { status?: number }) {
  const response = NextResponse.json(body, {
    status: options.status ?? 200,
  });
  response.headers.set("Cache-Control", NO_STORE_CACHE_CONTROL);
  return response;
}
