import { Trash2 } from "lucide-react";
import { formatDayLabel } from "@/lib/kanban/dates";
import { cn } from "@/lib/utils";

type CardFaceProps = {
  title: string;
  description: string;
  dueAt?: number | null;
  overlay?: boolean;
  onDelete?: () => void;
};

export function CardFace({
  title,
  description,
  dueAt,
  overlay,
  onDelete,
}: CardFaceProps) {
  return (
    <article
      className={cn(
        "rounded-md bg-card p-4 shadow-card",
        overlay && "shadow-grab",
      )}
    >
      <div className="flex items-start gap-1">
        <h3 className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink sm:text-base">
          {title}
        </h3>
        {onDelete ? (
          <button
            type="button"
            aria-label={`删除「${title}」`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="relative -mr-1 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-faint transition-[color,background-color] duration-(--motion-quick) ease-(--ease-out) hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 line-clamp-4 text-sm leading-normal text-muted">{description}</p>
      ) : null}
      {dueAt ? (
        <p className="mt-2 text-xs text-muted">{formatDayLabel(dueAt)}</p>
      ) : null}
    </article>
  );
}
