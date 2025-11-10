import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

function LoginFormWrapper() {
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginFormWrapper />
    </Suspense>
  );
}

