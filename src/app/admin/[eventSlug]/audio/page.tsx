import { AdminShell } from "@/components/admin/AdminShell";
import { AudioManager } from "@/components/admin/AudioManager";
import { requireUser } from "@/lib/auth";
import { getAudioAssets } from "@/lib/admin-data";

type Props = { params: Promise<{ eventSlug: string }> };

export default async function AudioPage({ params }: Props) {
  await requireUser();
  const { eventSlug } = await params;
  const assets = await getAudioAssets(eventSlug);
  return (
    <AdminShell title="音乐设置" eventSlug={eventSlug}>
      <AudioManager eventSlug={eventSlug} assets={assets} />
    </AdminShell>
  );
}
