export function DocumentLinks({
  requestId,
  documentId,
  documentName,
}: {
  requestId: string;
  documentId: string;
  documentName?: string;
}) {
  const href = `/documents/${requestId}/${documentId}`;
  return (
    <span className="flex items-center gap-3 text-xs">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={documentName ? `View ${documentName}` : undefined}
        className="px-1 py-1 text-emerald-800 underline"
      >
        View
      </a>
      <a
        href={`${href}?dl=1`}
        aria-label={documentName ? `Download ${documentName}` : undefined}
        className="px-1 py-1 text-emerald-800 underline"
      >
        Download
      </a>
    </span>
  );
}
