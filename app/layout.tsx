// app/layout.tsx
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import ReduxProvider from '@/store/ReduxProvider';
import { AuthProvider } from '@/app/context/AuthContext';

const montserrat = Montserrat({
  subsets: ['cyrillic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'Музыкальный сервис',
  description: 'Слушайте музыку онлайн',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={montserrat.className}>
        <ReduxProvider>
          <AuthProvider>{children}</AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
