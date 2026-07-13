import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { apiError, json, requireApiUser } from "@/lib/api";
import { getAdminEventSummary } from "@/lib/admin-data";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Context = { params: Promise<{ eventSlug: string }> };
export const runtime = "nodejs";

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const { eventSlug } = await context.params;
  const summary = await getAdminEventSummary(eventSlug);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("开奖记录");
  sheet.addRow(["活动", "奖项", "抽中组别", "抽奖时间", "是否撤销"]);
  summary.records.forEach((record) => {
    sheet.addRow([
      summary.event.name,
      record.prize?.name ?? "",
      record.group?.name ?? "",
      record.created_at,
      record.revoked ? "是" : "否",
    ]);
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${eventSlug}-records.xlsx"`,
    },
  });
}

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const { action, resultId } = await request.json().catch(() => ({}));
  if (action !== "revoke" || !resultId) return apiError("记录操作不正确。");
  if (!hasSupabaseServerEnv()) return json({ ok: true });
  await context.params;

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("draw_results")
    .update({
      revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_by: auth.user.id,
    })
    .eq("id", resultId);

  if (error) return apiError(error.message);
  return json({ ok: true });
}
