export function DocumentLinks({ requestId, documentId }: { requestId: string; documentId: string }) {
  const href = `/documents/${requestId}/${documentId}`;
  return (
    <span className="flex items-center gap-2 text-xs">
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-800 hover:underline">
        View
      </a>
      <a href={`${href}?dl=1`} className="text-emerald-800 hover:underline">
        Download
      </a>
    </span>
  );
}
