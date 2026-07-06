import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  color?: string;
  size?: number;
  className?: string;
  bg?: boolean;
}

export function CategoryIcon({ name, color, size = 20, className, bg = true }: Props) {
  const Icon =
    (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name] ?? Icons.Circle;

  if (!bg) {
    return <Icon size={size} color={color} className={className} />;
  }

  return (
    <div
      className={cn("grid place-items-center shrink-0", className)}
      style={{
        width: size + 22,
        height: size + 22,
        borderRadius: 13,
        backgroundColor: color ? `${color}22` : "var(--surface-2)",
        color: color ?? "var(--foreground)",
      }}
    >
      <Icon size={size} />
    </div>
  );
}
