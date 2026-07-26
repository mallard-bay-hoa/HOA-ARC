import { NextResponse } from "next/server";
import { getResidentSession, getBoardSession } from "@/lib/session";
import { getRequestById } from "@/lib/data/requests";
import { downloadDocumentFile } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string; documentId: string }> }
) {
  const { requestId, documentId } = await params;

  const [resident, board] = await Promise.all([getResidentSession(), getBoardSession()]);
  if (!resident && !board) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const arcRequest = await getRequestById(requestId);
  if (!arcRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Board members can view any request's documents; residents only their own property's.
  const allowed = Boolean(board) || Boolean(resident?.addresses.includes(arcRequest.address));
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const doc = arcRequest.documents.find((d) => d.id === documentId);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await downloadDocumentFile(doc.storagePath);
  const download = new URL(request.url).searchParams.get("dl") === "1";

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${encodeURIComponent(doc.name)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
