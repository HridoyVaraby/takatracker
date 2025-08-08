import type { FC, ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export const Layout: FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>
      </header>
      
      <main className="max-w-md mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};