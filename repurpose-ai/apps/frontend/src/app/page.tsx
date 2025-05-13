import Link from 'next/link';
import { AuthButtons } from '../components/AuthButtons';
import { ProtectedApiButton } from '../components/ProtectedApiButton';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] gap-8 px-4">
      <h1 className="text-4xl font-extrabold text-primary mb-2">Welcome to Repurpose AI</h1>
      <AuthButtons />
      <ProtectedApiButton />
      <p className="mt-4">
        <Link href="/dashboard">
          <button>Go to Dashboard</button>
        </Link>
      </p>
      </main>
  );
}
