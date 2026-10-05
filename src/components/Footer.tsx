import { getBoardSession } from "@/lib/session";

export async function Footer() {
  const board = await getBoardSession();

  return (
    <footer className="mt-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-6 py-6 text-center text-xs text-emerald-100">
      {board && (
        <>
          <a
            href="/board-handbook.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            Board Handbook
          </a>
          <span aria-hidden="true">|</span>
        </>
      )}
      <span>
        Having trouble? Email{" "}
        <a href="mailto:mallardbayhoaboard@gmail.com" className="underline hover:text-white">
          mallardbayhoaboard@gmail.com
        </a>
      </span>
    </footer>
  );
}
