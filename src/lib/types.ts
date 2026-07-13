export type RuntimePhase =
  | "idle"
  | "accelerating"
  | "spinning"
  | "decelerating"
  | "suspense"
  | "revealed"
  | "emergency";

export type DrawSessionStatus =
  | "idle"
  | "spinning"
  | "stop_requested"
  | "revealed"
  | "cancelled";

export type AppEvent = {
  id: string;
  name: string;
  slug: string;
  display_token: string;
  status: "draft" | "active" | "archived";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RaffleGroup = {
  id: string;
  event_id: string;
  name: string;
  participant_count: number;
  enabled: boolean;
  sort_order: number;
  allow_repeat_win?: boolean;
  created_at: string;
  updated_at: string;
};

export type Participant = {
  id: string;
  event_id: string;
  group_id: string;
  participant_code: string;
  name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  group?: Pick<RaffleGroup, "id" | "name">;
};

export type Prize = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  total_draws: number;
  completed_draws: number;
  draw_count_per_round: number;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DrawResult = {
  id: string;
  draw_session_id: string;
  event_id: string;
  prize_id: string;
  group_id: string;
  result_order: number;
  revoked: boolean;
  revoked_at: string | null;
  revoked_by: string | null;
  created_at: string;
  group?: Pick<RaffleGroup, "id" | "name">;
  prize?: Pick<Prize, "id" | "name">;
};

export type DrawSession = {
  id: string;
  event_id: string;
  prize_id: string;
  status: DrawSessionStatus;
  candidate_group_snapshot: RaffleGroup[];
  started_at: string | null;
  stop_requested_at: string | null;
  reveal_at: string | null;
  revealed_at: string | null;
  created_by: string | null;
  created_at: string;
  prize?: Pick<Prize, "id" | "name" | "draw_count_per_round">;
  results?: DrawResult[];
};

export type RuntimeSettings = {
  acceleration_ms: number;
  deceleration_ms: number;
  suspense_ms: number;
  shake_strength: number;
  animation_enabled: boolean;
  music_enabled: boolean;
  tension_volume: number;
  reveal_volume: number;
  keyboard_shortcuts_enabled: boolean;
  allow_group_repeat_win: boolean;
  exclude_prize_winners: boolean;
  exclude_event_winners: boolean;
};

export type EventRuntime = {
  event_id: string;
  phase: RuntimePhase;
  current_draw_session_id: string | null;
  current_prize_id: string | null;
  selected_group_ids: string[];
  revision: number;
  settings: RuntimeSettings;
  updated_at: string;
};

export type AudioAsset = {
  id: string;
  event_id: string;
  name: string;
  file_url: string;
  file_type: string;
  audio_role: "tension" | "reveal";
  volume: number;
  enabled: boolean;
  created_at: string;
};

export type DisplayState = {
  event: Pick<AppEvent, "id" | "name" | "slug" | "display_token">;
  runtime: EventRuntime;
  currentPrize: Pick<Prize, "id" | "name"> | null;
  currentSession: DrawSession | null;
  revealedGroups: Pick<RaffleGroup, "id" | "name">[];
  audioAssets: AudioAsset[];
  displayOnline: boolean;
  lastHeartbeatAt: string | null;
};

export type AdminEventSummary = {
  event: AppEvent;
  runtime: EventRuntime | null;
  groups: RaffleGroup[];
  prizes: Prize[];
  records: DrawResult[];
  displayOnline: boolean;
  lastHeartbeatAt: string | null;
};
