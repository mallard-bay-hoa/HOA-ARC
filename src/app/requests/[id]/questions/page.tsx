import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById } from "@/lib/data/requests";
import { getCategory } from "@/lib/domain/categories";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui";
import { QuestionForm } from "./QuestionForm";

export default async function QuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(id);
  if (!request || !session.addresses.includes(request.address)) notFound();

  const category = getCategory(request.categorySlug);
  if (!category) notFound();

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title={`New Request — ${category.name}`} />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
        <Link href="/requests/new" className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700">
          &larr; Choose a different category
        </Link>
        <Card>
          <QuestionForm
            requestId={request.id}
            categorySlug={request.categorySlug}
            categoryName={category.name}
            initialAnswers={request.answers}
          />
        </Card>
      </main>
    </>
  );
}
