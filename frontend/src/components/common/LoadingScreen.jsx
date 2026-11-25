import { LoaderCircle } from 'lucide-react';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--stm-bg)] px-4">
      <div className="flex flex-col items-center gap-3 text-[var(--stm-muted)]">
        <LoaderCircle className="h-8 w-8 animate-spin text-[var(--stm-accent)]" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
