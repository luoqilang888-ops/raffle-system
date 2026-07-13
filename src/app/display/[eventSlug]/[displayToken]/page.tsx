import { notFound } from "next/navigation";
import { DisplayClient } from "@/components/display/DisplayClient";
import { getDisplayState } from "@/lib/display-data";

type Props = { params: Promise<{ eventSlug: string; displayToken: string }> };

export default async function DisplayPage({ params }: Props) {
  const { eventSlug, displayToken } = await params;
  const state = await getDisplayState(eventSlug, displayToken);
  if (!state) notFound();
  return (
    <DisplayClient
      initialState={state}
      eventSlug={eventSlug}
      displayToken={displayToken}
    />
  );
}
