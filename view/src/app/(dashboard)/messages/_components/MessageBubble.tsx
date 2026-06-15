import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

function statusIcon(status: string) {
  switch (status) {
    case "queued": return <span className="text-[10px] text-muted-foreground">○</span>;
    case "sent": return <span className="text-[10px] text-muted-foreground">✓</span>;
    case "delivered": return <span className="text-[10px] text-blue-500 dark:text-blue-400">✓✓</span>;
    case "failed": return <span className="text-[10px] text-destructive">❌</span>;
    default: return null;
  }
}

interface Props { message: Message; }

export default function MessageBubble({ message }: Props) {
  const isOutbound = message.direction === "outbound";
  return (
    <div className={cn("mb-4 flex", isOutbound ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[80%] rounded-lg px-4 py-2", isOutbound ? "bg-primary text-primary-foreground" : "bg-muted")}>
        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
        {message.mediaUrls?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.mediaUrls.map((url, i) => (
              <img key={i} src={url} alt="attachment" className="max-h-40 rounded" loading="lazy" />
            ))}
          </div>
        )}
        <div className="mt-1 flex items-center justify-end gap-1">
          <span className="text-[10px] opacity-70">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {isOutbound && statusIcon(message.status)}
        </div>
      </div>
    </div>
  );
}
