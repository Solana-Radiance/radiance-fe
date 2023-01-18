import 'tailwindcss/tailwind.css';
import '../styles/globals.css';
import '@dialectlabs/react-ui/index.css';
import './index.scss';

import React, { useCallback, useEffect , useState } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { SolanaWalletContext } from '../components/SolanaWallet';

import { CardinalTwitterIdentityResolver } from '@dialectlabs/identity-cardinal';
import { DialectDappsIdentityResolver } from '@dialectlabs/identity-dialect-dapps';
import { SNSIdentityResolver } from '@dialectlabs/identity-sns';
import {
  DialectSolanaSdk,
  DialectSolanaWalletAdapter,
  SolanaConfigProps,
} from '@dialectlabs/react-sdk-blockchain-solana';
import {
  BottomChat,
  ConfigProps,
  defaultVariables,
  DialectNoBlockchainSdk,
  DialectThemeProvider,
  DialectUiManagementProvider,
  IncomingThemeVariables,
} from '@dialectlabs/react-ui';
import {
  useConnection as useSolanaConnection,
  useWallet as useSolanaWallet,
} from '@solana/wallet-adapter-react';
import { SolanaWalletButton } from '../components/SolanaWallet';
import {
  solanaWalletToDialectWallet,
} from '../utils/wallet';
import { CivicIdentityResolver } from '@dialectlabs/identity-civic';
import { NextComponentType, NextPageContext } from 'next';
import { LayoutProps } from './_app-type';
import { ADDRESS_LENGTH } from '../constants/numbers';



// TODO: Use useTheme instead of explicitly importing defaultVariables
export const themeVariables: IncomingThemeVariables = {
  dark: {
    bellButton:
      'w-12 h-12 shadow-xl shadow-neutral-800 border border-neutral-600 hover:shadow-neutral-700',
    slider:
      'sm:rounded-t-3xl shadow-xl shadow-neutral-900 sm:border-t sm:border-l sm:border-r border-neutral-800',
  },
  light: {
    bellButton:
      'w-12 h-12 shadow-md hover:shadow-lg shadow-neutral-300 hover:shadow-neutral-400 text-teal',
    slider:
      'sm:border-t sm:border-l sm:border-r border-border-light shadow-lg shadow-neutral-300 sm:rounded-t-3xl',
    colors: {
      textPrimary: 'text-dark',
    },
    button: `${defaultVariables.light.button} border-none bg-pink`,
    highlighted: `${defaultVariables.light.highlighted} bg-light border border-border-light`,
    input: `${defaultVariables.light.input} border-b-teal focus:ring-teal text-teal`,
    iconButton: `${defaultVariables.light.iconButton} hover:text-teal hover:opacity-100`,
    avatar: `${defaultVariables.light.avatar} bg-light`,
    messageBubble: `${defaultVariables.light.messageBubble} border-none bg-blue text-black`,
    sendButton: `${defaultVariables.light.sendButton} bg-teal`,
  },
};

function PageLayout({ Component, pageProps }: LayoutProps) {
  const { connection: solanaConnection } = useSolanaConnection();
  const [address, setAddress] = useState("");
  const solanaWallet = useSolanaWallet();

  const [dialectSolanaWalletAdapter, setDialectSolanaWalletAdapter] =
    useState<DialectSolanaWalletAdapter | null>(null);

  useEffect(() => {
    setDialectSolanaWalletAdapter(solanaWalletToDialectWallet(solanaWallet));
  }, [solanaWallet]);

  const DialectProviders: React.FC<{ children: React.ReactNode }> = useCallback(
    (props: { children: React.ReactNode }) => {
      const dialectConfig: ConfigProps = {
        environment: 'development',
        dialectCloud: {
          tokenStore: 'local-storage',
        },
        identity: {
          resolvers: [
            new DialectDappsIdentityResolver(),
            new SNSIdentityResolver(solanaConnection),
            new CardinalTwitterIdentityResolver(solanaConnection),
            new CivicIdentityResolver(solanaConnection),
          ],
        },
      };

      if (dialectSolanaWalletAdapter) {
        const solanaConfig: SolanaConfigProps = {
          wallet: dialectSolanaWalletAdapter,
        };

        return (
          <DialectSolanaSdk config={dialectConfig} solanaConfig={solanaConfig}>
            {props.children}
          </DialectSolanaSdk>
        );
      }
      
      return <DialectNoBlockchainSdk>{props.children}</DialectNoBlockchainSdk>;
    },
    [
      solanaConnection,
      dialectSolanaWalletAdapter,
    ]
  );

  return (
    <DialectProviders>
      <DialectUiManagementProvider>
        <DialectThemeProvider theme="dark" variables={themeVariables}>
          <div>
            {/* Headers */}
            <header>
              <span className={`logo ${address.length === ADDRESS_LENGTH? 'active' : ''}`}>Logo</span>
              <SolanaWalletButton />
            </header>
            <div className={`sidebar ${address.length === ADDRESS_LENGTH? 'active' : ''}`}></div>
            <Component 
              {...pageProps} 
              handleSearch={(address: string) => setAddress(address)} // Home
            />
            <BottomChat dialectId="dialect-bottom-chat" />
            {/* Footers */}
            {/* <footer>this is a footer</footer> */}
          </div>
        </DialectThemeProvider>
      </DialectUiManagementProvider>
    </DialectProviders>
  );
}

// layout
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        
        <link 
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css" 
          integrity="sha512-KfkfwYDsLkIlwQp6LFnl8zNdLGxu9YAA1QvwINks4PhcElQSvqcyVLLD9aMhXd13uQjoXtEKNosOWaZqXgel0g==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
      </Head>
      {/* Contexts */}
      <SolanaWalletContext>
        <PageLayout 
          Component={Component} 
          pageProps={pageProps}
        />
      </SolanaWalletContext>
    </>
  );
}
export default MyApp;
