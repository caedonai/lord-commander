import './global.css';
import { QueryProvider } from '../providers/query-provider';

export const metadata = {
  title: 'Lord Commander CLI - UI',
  description: 'Modern web interface for the Lord Commander CLI SDK',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
