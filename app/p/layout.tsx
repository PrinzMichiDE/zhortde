import type { Metadata } from 'next';

// Paste pages can contain sensitive content. Keep them out of search indexes by default.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function PasteRouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}

