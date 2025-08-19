import type { Metadata } from 'next';
import ThemeProvider from '../components/ThemeProvider';
import { NotificationProvider } from '../contexts/NotificationContext';

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
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
