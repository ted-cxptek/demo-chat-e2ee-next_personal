import type { Metadata } from 'next';
import ThemeProvider from '../components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Secure Chat App',
  description: 'End-to-end encrypted chat application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
