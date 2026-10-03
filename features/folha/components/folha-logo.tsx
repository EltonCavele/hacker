export function FolhaLogo({ className }: { className?: string }) {
  return (
    <span className={className}>
      <svg aria-hidden viewBox="0 0 40 40" className="size-full">
        <path
          d="M8 22c2-10 10-16 22-18-2 9-1 16 4 22-9 2-18-1-26-4Z"
          fill="currentColor"
        />
        <path d="M14 22.5 18.2 26.8 27 16" fill="none" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" />
      </svg>
      <span className="sr-only">Folha Viva</span>
    </span>
  );
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
