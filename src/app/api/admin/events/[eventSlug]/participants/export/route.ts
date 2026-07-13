import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { getParticipants } from "@/lib/admin-data";
import { requireApiUser } from "@/lib/api";

type Context = { params: Promise<{ eventSlug: string }> };
export const runtime = "nodejs";

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const { eventSlug } = await context.params;
  const participants = await getParticipants(eventSlug);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("参与名单");
  sheet.addRow(["编号", "姓名", "手机号", "组别"]);
  participants.forEach((participant) => {
    sheet.addRow([
      participant.participant_code,
      participant.name,
      participant.phone ?? "",
      participant.group?.name ?? "",
    ]);
  });
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${eventSlug}-participants.xlsx"`,
    },
  });
}
