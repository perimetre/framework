import SignupForm from '@/components/UI/SignupForm';

/**
 * A server page. UI SDK modules carry their own "use client", and the form
 * component is a client component because it calls `useForm`.
 */
export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Sign up</h1>
      <SignupForm />
    </main>
  );
}
