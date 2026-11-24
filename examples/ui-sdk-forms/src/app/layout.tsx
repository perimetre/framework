import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UI SDK forms example',
  description: 'UI SDK form controls with React Hook Form and Zod'
};

/**
 * Root layout. UI SDK needs no provider, so there is nothing to wrap.
 */
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
