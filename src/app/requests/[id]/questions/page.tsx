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

  const request = getRequestById(id);
  if (!request || request.residentEmail !== session.email) notFound();

  const category = getCategory(request.categorySlug);
  if (!category) notFound();

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title={`New Request — ${category.name}`} />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
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
