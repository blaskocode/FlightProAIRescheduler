import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 pb-20 md:pb-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-2xl md:text-4xl font-bold text-center mb-6 md:mb-8">
          Flight Schedule Pro AI Rescheduler
        </h1>
        <p className="text-center text-base md:text-lg text-muted-foreground mb-8">
          AI-Powered Weather Cancellation & Rescheduling System for Flight Schools
        </p>
        <div className="mt-8 text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="min-h-[44px]">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-h-[44px]">
              <Link href="/signup">Sign Up</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-h-[44px]">
              <Link href="/discovery">Book Discovery Flight</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
