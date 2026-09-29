export function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] p-4">
      <div className="card grid w-full max-w-md gap-3 p-6 text-center">{children}</div>
    </main>
  );
}
