import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <Construction className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      <span className="mt-4 inline-flex items-center rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info">
        Em desenvolvimento
      </span>
    </div>
  );
}
