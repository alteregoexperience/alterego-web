export const EVENT_DELETION_RETENTION_DAYS = 30;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getEventPurgeDate(deletedAt: string | Date) {
  return new Date(
    new Date(deletedAt).getTime() + EVENT_DELETION_RETENTION_DAYS * DAY_IN_MS,
  );
}

export function getEventDeletionCutoff(now = new Date()) {
  return new Date(
    now.getTime() - EVENT_DELETION_RETENTION_DAYS * DAY_IN_MS,
  );
}
