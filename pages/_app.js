import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Add Tailwind CSS CDN
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      // Cleanup
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  return <Component {...pageProps} />;
}
