import type { ReactNode } from 'react';

export const metadata = { title: 'baked-icons · Next.js' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui', padding: 32 }}>{children}</body>
    </html>
  );
}
