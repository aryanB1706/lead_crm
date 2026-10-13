import LeadBoard from "../components/LeadBoard";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">LeadFlow</h1>
      <LeadBoard />
    </main>
  );
}
