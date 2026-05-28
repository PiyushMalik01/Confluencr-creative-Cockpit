import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { AmbientBg } from '@/components/ambient-bg';

export const metadata: Metadata = {
  title: 'Confluencr Creative Cockpit',
  description: 'Brand brief to three on-brand image concepts. Free with your ChatGPT subscription.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AmbientBg />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
