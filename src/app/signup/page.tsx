import { Suspense } from 'react';
import { SignupForm } from '@/components/auth/SignupForm';

function SignupFormWrapper() {
  return <SignupForm />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupFormWrapper />
    </Suspense>
  );
}

