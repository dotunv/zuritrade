import './global.css';
import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { Space_Grotesk, Inter } from 'next/font/google';

const Providers = dynamic(() => import('./providers').then((m) => m.Providers), {
  ssr: false,
});

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading' });
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className={spaceGrotesk.className}>
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
