import type { FC, ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export const Layout: FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-surface-white shadow-sm border-b border-surface-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-primary">{title}</h1>
        </div>
      </header>
      
      <main className="max-w-md mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};