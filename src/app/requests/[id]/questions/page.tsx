import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById } from "@/lib/data/requests";
import { getCategory } from "@/lib/domain/categories";
import { getCategoryModule } from "@/lib/domain/registry";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui";
import { CertifyForm } from "./CertifyForm";

export default async function QuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(id);
  if (!request || !session.addresses.includes(request.address)) notFound();

  const category = getCategory(request.categorySlug);
  if (!category) notFound();

  const requirements = getCategoryModule(request.categorySlug)?.requirements ?? [];
  const initialDescription = typeof request.answers.description === "string" ? request.answers.description : "";

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title={`New Request — ${category.name}`} />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
        <Link href="/requests/new" className="mb-4 inline-block text-sm text-emerald-100 hover:text-white">
          &larr; Choose a different category
        </Link>
        <Card>
          <CertifyForm requestId={request.id} requirements={requirements} initialDescription={initialDescription} />
        </Card>
      </main>
    </>
  );
}
