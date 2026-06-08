import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#0a0808] text-[#fff8e8] px-4 relative overflow-hidden">
      {/* Premium ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(245,200,66,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(194,123,70,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 space-y-8 p-8 border border-mix(in oklab, var(--border) 80%, var(--yor-copper) 20%) rounded-3xl bg-[rgba(15,12,11,0.62)] backdrop-blur-2xl shadow-[0_32px_64px_rgba(0,0,0,0.56)]">
        {/* Large stylized 404 */}
        <h1 className="text-8xl font-black tracking-widest bg-gradient-to-r from-[#f1b943] via-[#8e4d29] to-[#f1b943] bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(245,200,66,0.2)] animate-pulse">
          404
        </h1>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Page Not Found
          </h2>
          <p className="text-sm text-[#c5b59f] leading-relaxed">
            The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full sm:w-auto border-mix(in oklab, var(--border) 60%, var(--yor-copper) 40%) hover:bg-[rgba(142,77,41,0.12)] text-[#fff8e8]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto bg-gradient-to-r from-[#8e4d29] to-[#f1b943] hover:opacity-90 text-black font-semibold"
          >
            <Home className="mr-2 h-4 w-4" />
            Home Page
          </Button>
        </div>
      </div>
    </div>
  );
}
