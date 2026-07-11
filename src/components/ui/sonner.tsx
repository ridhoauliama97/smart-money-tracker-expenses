import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "color-mix(in oklab, var(--income) 15%, var(--background))",
          "--success-text": "var(--income)",
          "--success-border": "var(--income)",
          "--error-bg": "color-mix(in oklab, var(--expense) 15%, var(--background))",
          "--error-text": "var(--expense)",
          "--error-border": "var(--expense)",
          "--warning-bg": "color-mix(in oklab, oklch(0.8 0.15 80) 15%, var(--background))",
          "--warning-text": "oklch(0.8 0.15 80)",
          "--warning-border": "oklch(0.8 0.15 80)",
          "--info-bg": "color-mix(in oklab, var(--brand) 15%, var(--background))",
          "--info-text": "var(--brand)",
          "--info-border": "var(--brand)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
