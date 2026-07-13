import { NextRequest } from "next/server";
import { apiError, json } from "@/lib/api";
import { getDisplayState } from "@/lib/display-data";

type Context = { params: Promise<{ eventSlug: string }> };

export async function GET(request: NextRequest, context: Context) {
  const { eventSlug } = await context.params;
  const displayToken = new URL(request.url).searchParams.get("displayToken");
  if (!displayToken) return apiError("缺少大屏访问令牌。", 401);
  const state = await getDisplayState(eventSlug, displayToken);
  if (!state) return apiError("大屏链接无效或已重新生成。", 404);
  return json({ state });
}
