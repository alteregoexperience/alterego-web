export type EventParticipantRow = {
  points: number;
  participants: {
    id: string;
    name: string;
    instagram: string | null;
  } | null;
};

export type Participant = {
  id: string;
  name: string;
  instagram: string;
  points: number;
};

// temp
export const DEFAULT_EVENT_ID = "33243d4a-f246-42df-94b1-c846fcbc327e";
