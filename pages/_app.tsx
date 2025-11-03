import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ToastProvider } from '../components/Toast';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <title>RT Multiserviços</title>
        <meta name="description" content="Serviços veiculares e logísticos" />
      </Head>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </>
  );
}
