import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '../components/providers';
import ClientOnly from '../components/client-only';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'DeFi Lending & Borrowing',
    description: 'DeFi Lending & Borrowing Platform on Paseo Asset Hub',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <ClientOnly>
                    <Providers>
                        {children}
                    </Providers>
                </ClientOnly>
            </body>
        </html>
    );
}
