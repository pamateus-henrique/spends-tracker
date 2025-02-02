import "./globals.css";
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>
        <nav className='bg-white shadow-lg'>
          <div className='container mx-auto px-6 py-4'>
            <div className='flex items-center justify-between'>
              <div className='text-xl font-semibold'>Receipt Tracker</div>
              <div className='space-x-4'>
                <Link
                  href='/dashboard'
                  className='text-gray-700 hover:text-gray-900'
                >
                  Dashboard
                </Link>
                <Link
                  href='/upload'
                  className='text-gray-700 hover:text-gray-900'
                >
                  Upload
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
