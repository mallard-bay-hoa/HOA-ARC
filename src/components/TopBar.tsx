import Link from "next/link";

export function TopBar({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div>
          <Link href="/" className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            {eyebrow}
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        </div>
        {right}
      </div>
    </header>
  );
}
