/**
 * Order tracking timeline.
 *
 * IMPORTANT: this is deliberately NOT courier or GPS tracking. It reflects only
 * what the app genuinely knows. The first stage is complete the moment the order
 * row exists; every later stage is rendered as pending and carries no date,
 * because the database has no status transitions to read yet and none are
 * invented here.
 *
 * Completed stages use the lemon/lime accent; pending stages are muted. The rail
 * is a vertical timeline that works on mobile and simply gets more breathing room
 * on larger screens.
 */

import { formatDate } from "@/lib/money";

export interface TrackingStage {
  label: string;
  /** True only for a stage backed by a real record. */
  done: boolean;
  /** Real timestamp, present only when `done`. */
  at?: string | null;
  /** Short supporting line. */
  note: string;
}

interface OrderTrackingTimelineProps {
  stages: TrackingStage[];
}

/** Filled tick for a completed stage. */
function DoneTick() {
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-accent-400 text-ink-950">
      <svg
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m5 13 4 4L19 7" />
      </svg>
    </span>
  );
}

/** Hollow marker for a pending stage. */
function PendingTick() {
  return (
    <span
      aria-hidden
      className="flex size-7 items-center justify-center rounded-full border-2 border-ink-700 bg-ink-900"
    />
  );
}

export function OrderTrackingTimeline({ stages }: OrderTrackingTimelineProps) {
  const lastDoneIndex = stages.reduce(
    (acc, stage, i) => (stage.done ? i : acc),
    -1,
  );

  return (
    <ol className="relative space-y-0">
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        const connectorDone = i <= lastDoneIndex;

        return (
          <li key={stage.label} className="relative flex gap-4 pb-7 last:pb-0">
            {/* Rail. Rendered between markers so the line never dangles. */}
            {!isLast && (
              <span
                aria-hidden
                className={`absolute left-[0.6875rem] top-7 h-[calc(100%-1rem)] w-px origin-top ${
                  connectorDone ? "bg-accent-400/50" : "bg-ink-800"
                } ${connectorDone ? "threads-rail motion-safe:animate-[threads-rail-fill_600ms_ease-out_both]" : ""}`}
              />
            )}

            <span className="relative z-10 shrink-0 pt-0.5">
              {stage.done ? <DoneTick /> : <PendingTick />}
            </span>

            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-semibold ${
                  stage.done ? "text-bone-50" : "text-ink-400"
                }`}
              >
                {stage.label}
              </p>

              {stage.done && stage.at && (
                <p className="mt-1 font-mono text-xs text-accent-400">
                  {formatDate(stage.at)}
                </p>
              )}

              <p className={`mt-1 text-xs ${stage.done ? "text-ink-400" : "text-ink-500"}`}>
                {stage.note}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}