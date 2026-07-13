import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { apiError, getEventBySlug, json, requireApiUser } from "@/lib/api";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ eventSlug: string }> };
export const runtime = "nodejs";

type ImportRow = {
  编号?: string;
  姓名?: string;
  手机号?: string;
  组别?: string;
};

export async function POST(request: NextRequest, context: Context) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file");
  const mode = formData.get("mode") === "overwrite" ? "overwrite" : "append";
  if (!(file instanceof File)) return apiError("请上传 Excel 文件。");

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const firstSheet = workbook.worksheets[0];
  const headerRow = firstSheet.getRow(1);
  const headers = headerRow.values as string[];
  const rows: ImportRow[] = [];
  firstSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const item: ImportRow = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber] as keyof ImportRow | undefined;
      if (header) item[header] = String(cell.value ?? "");
    });
    rows.push(item);
  });

  if (!hasSupabaseServerEnv()) {
    return json({ successCount: rows.length, failCount: 0, failures: [] });
  }

  const { eventSlug } = await context.params;
  const event = await getEventBySlug(eventSlug);
  const supabase = createServiceSupabaseClient();
  const { data: groups, error: groupError } = await supabase
    .from("groups")
    .select("id,name")
    .eq("event_id", event.id);
  if (groupError) return apiError(groupError.message);

  const groupMap = new Map((groups ?? []).map((group) => [group.name, group.id]));
  const failures: { row: number; reason: string }[] = [];
  const inserts = rows.flatMap((row, index) => {
    const code = String(row["编号"] ?? "").trim();
    const name = String(row["姓名"] ?? "").trim();
    const groupName = String(row["组别"] ?? "").trim();
    const groupId = groupMap.get(groupName);

    if (!code || !name || !groupName) {
      failures.push({ row: index + 2, reason: "编号、姓名、组别为必填项。" });
      return [];
    }
    if (!groupId) {
      failures.push({ row: index + 2, reason: `组别不存在：${groupName}` });
      return [];
    }

    return [
      {
        event_id: event.id,
        group_id: groupId,
        participant_code: code,
        name,
        phone: row["手机号"] ? String(row["手机号"]).trim() : null,
      },
    ];
  });

  if (mode === "overwrite") {
    const { error } = await supabase
      .from("participants")
      .delete()
      .eq("event_id", event.id);
    if (error) return apiError(error.message);
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from("participants").insert(inserts);
    if (error) return apiError(error.message);
  }

  await supabase.rpc("refresh_group_participant_counts", {
    p_event_id: event.id,
  });

  return json({
    successCount: inserts.length,
    failCount: failures.length,
    failures,
  });
}
