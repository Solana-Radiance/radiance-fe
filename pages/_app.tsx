import 'tailwindcss/tailwind.css';
import '../styles/globals.scss';
import '@dialectlabs/react-ui/index.css';
import './home/index.scss';
import './swaps/styles.scss';
import './nfts/styles.scss';
import './stakes/styles.scss';
import '../styles/keyframes.scss';
import 'react-toastify/dist/ReactToastify.css';

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
  ChatNavigationHelpers,
  ConfigProps,
  defaultVariables,
  DialectNoBlockchainSdk,
  DialectThemeProvider,
  DialectUiManagementProvider,
  IncomingThemeVariables,
  useDialectUiId,
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
import { BottomChatWrapperProps, LayoutProps } from './_app-type';
import { ADDRESS_LENGTH } from '../constants/numbers';

import logo from '../components/Icon/assets/logo-kida.png';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ToastContainer } from 'react-toastify';

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

const BottomChatWrapper = ({ handleNavigation }: BottomChatWrapperProps) => {
  const { ui, open, close, navigation } = useDialectUiId<ChatNavigationHelpers>(
    'dialect-bottom-chat'
  );

  useEffect(() => {
    handleNavigation({
      navigation,
      open
    });
  }, [handleNavigation, navigation, open]);

  return (
    <BottomChat dialectId="dialect-bottom-chat" />
  )
}

function PageLayout({ Component, pageProps }: LayoutProps) {
  const { connection: solanaConnection } = useSolanaConnection();
  const [address, setAddress] = useState("");
  const solanaWallet = useSolanaWallet();
  const router = useRouter();

  const [dialectSolanaWalletAdapter, setDialectSolanaWalletAdapter] =
    useState<DialectSolanaWalletAdapter | null>(null);

  // to pass bottom chat navigation params
  const [navigation, setNavigation] = useState<any>(); // navigator not exported

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

  // have to do this else the compiler wont compile
  const AnyComponent = Component as any;

  return (
    <div>
      {/* Headers */}
      <header className='main'>
        <div className={`logo ${address.length === ADDRESS_LENGTH? 'active' : ''}`}>
          <Image src={logo} alt=""/>
        </div>
        <SolanaWalletButton />
      </header>
      <div className={`sidebar ${address.length === ADDRESS_LENGTH? 'active' : ''}`}>
        <div className="logo-container">
          <div className="logo">
            <Image src={logo} alt="" />
          </div>
        </div>
        <div
          className={"link " + (router.pathname === "/home/[[...defaultAddress]]"? "active" : "")}
        >
          <Link 
            href={{
              pathname: `/home/${address}`,
            }} 
          >
            <div>Home</div>
          </Link>
        </div>
        <div
          className={"link " + (router.pathname === "/swaps/[defaultAddress]"? "active" : "")}
        >
          <Link 
            href={{
              pathname: `/swaps/${address}`,
            }} 
          >
            <div>Swaps</div>
          </Link>
        </div>
        <div
          className={"link " + (router.pathname === "/nfts/[defaultAddress]"? "active" : "")}
        >
          <Link 
            href={{
              pathname: `/nfts/${address}`,
            }} 
          >
            <div>NFTs</div>
          </Link>

        </div>
        <div
          className={"link " + (router.pathname === "/stakes/[defaultAddress]"? "active" : "")}
        >
          <Link 
            href={{
              pathname: `/stakes/${address}`,
            }} 
          >
            <div>Stakes</div>
          </Link>
        </div>
        <div className="credits-container">
          <div className="created-by">
            <strong>Created by</strong>
            <a href="https://twitter.com/darksoulsfanlol" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter" style={{color: '#00acee'}}></i><span style={{marginLeft: 5}}>Kida</span></a> 
          </div>
          <div className="powered-by">
            <strong>Data provided by</strong> 
            <div className="position-relative">
              <a href="https://sdk.flipsidecrypto.xyz/shroomdk" className="flipside-link" target="_blank" rel="noopener noreferrer">
                <svg preserveAspectRatio="xMidYMid meet" data-bbox="0 0.998 160.005 24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0.998 160.005 24" height="22" data-type="color" role="presentation" aria-hidden="true" aria-labelledby="svgcid--hkzmhd-aitowa"><title id="svgcid--hkzmhd-aitowa"></title>
                    <g>
                        <path fill="#ffffff" d="M37.733 6.367a13.595 13.595 0 0 0-1.79-.14c-1.33 0-1.994.616-1.994 1.848v.914h2.238v1.808h-2.238v9.06h-2.47v-9.06H29.8V8.989h1.678v-.975c.007-1.225.373-2.163 1.099-2.812.732-.656 1.762-.984 3.091-.984.827 0 2.339.16 4.536.482v15.157h-2.471V6.367zm7.83 13.49h-2.471V8.989h2.47v10.868zm-2.624-13.69c0-.376.119-.687.356-.935.244-.248.59-.372 1.037-.372.448 0 .794.124 1.038.372s.366.56.366.934c0 .368-.122.677-.366.924-.244.241-.59.362-1.038.362-.447 0-.793-.12-1.037-.362a1.284 1.284 0 0 1-.356-.924zm14.96 8.366c0 1.681-.387 3.024-1.16 4.028-.773.998-1.81 1.497-3.112 1.497-1.207 0-2.173-.392-2.898-1.175v5.153h-2.471V8.989h2.278l.101 1.105c.726-.87 1.712-1.306 2.96-1.306 1.342 0 2.393.495 3.152 1.486.766.985 1.15 2.354 1.15 4.109v.15zm-2.462-.21c0-1.085-.22-1.946-.66-2.582-.435-.636-1.058-.954-1.872-.954-1.01 0-1.736.411-2.176 1.235v4.822c.447.843 1.18 1.265 2.197 1.265.786 0 1.4-.311 1.84-.934.448-.63.671-1.58.671-2.853zm10.729 2.58c0-.434-.183-.766-.55-.993-.359-.228-.959-.43-1.8-.603-.84-.174-1.541-.395-2.104-.663-1.234-.59-1.851-1.443-1.851-2.562 0-.937.4-1.72 1.2-2.35.8-.63 1.817-.944 3.05-.944 1.316 0 2.377.321 3.184.964.813.643 1.22 1.477 1.22 2.501h-2.471a1.48 1.48 0 0 0-.529-1.165c-.352-.315-.82-.472-1.403-.472-.543 0-.987.124-1.332.372a1.17 1.17 0 0 0-.509.994c0 .375.16.666.478.874.319.207.963.418 1.932.633.97.207 1.729.458 2.278.753.556.288.966.636 1.23 1.045.272.408.408.904.408 1.486 0 .978-.41 1.772-1.231 2.38-.82.604-1.895.905-3.224.905-.901 0-1.705-.16-2.41-.482-.705-.322-1.254-.764-1.647-1.326a3.112 3.112 0 0 1-.59-1.818h2.4c.034.576.254 1.021.66 1.336.408.308.947.462 1.618.462.65 0 1.145-.12 1.485-.362.338-.248.508-.569.508-.964zm7.22 2.954h-2.47V8.989h2.47v10.868zm-2.623-13.69c0-.376.118-.687.355-.935.245-.248.59-.372 1.038-.372.447 0 .793.124 1.037.372.244.248.366.56.366.934 0 .368-.122.677-.366.924-.244.241-.59.362-1.037.362-.448 0-.793-.12-1.038-.362a1.284 1.284 0 0 1-.355-.924zm4.86 8.175c0-1.674.394-3.016 1.18-4.027.787-1.018 1.84-1.527 3.163-1.527 1.166 0 2.108.402 2.827 1.205V4.428h2.47v15.429h-2.236l-.122-1.125c-.74.884-1.726 1.326-2.96 1.326-1.288 0-2.332-.512-3.132-1.537-.793-1.024-1.19-2.417-1.19-4.179zm2.472.211c0 1.105.213 1.97.64 2.592.434.616 1.048.924 1.841.924 1.01 0 1.75-.445 2.217-1.336v-4.64c-.454-.871-1.187-1.306-2.197-1.306-.8 0-1.417.314-1.85.944-.434.623-.651 1.564-.651 2.822zm14.593 5.505c-1.567 0-2.837-.485-3.813-1.456-.97-.978-1.455-2.277-1.455-3.898v-.301c0-1.085.21-2.053.63-2.903.428-.857 1.024-1.524 1.79-1.999a4.762 4.762 0 0 1 2.563-.713c1.499 0 2.655.472 3.468 1.416.82.944 1.23 2.28 1.23 4.008v.984h-7.19c.075.898.376 1.607.906 2.13.535.522 1.206.783 2.013.783 1.132 0 2.054-.452 2.767-1.356l1.332 1.256a4.468 4.468 0 0 1-1.77 1.517c-.732.354-1.556.532-2.471.532zm-.295-9.312c-.678 0-1.227.235-1.647.704-.414.468-.678 1.121-.794 1.958h4.709v-.18c-.055-.817-.275-1.433-.661-1.849-.387-.421-.923-.633-1.607-.633zm11.796 8.297c.407 0 .793-.056 1.16-.17.373-.12.702-.292.986-.513.285-.22.515-.485.692-.793a2.43 2.43 0 0 0 .315-1.065h1.169a3.221 3.221 0 0 1-.406 1.427c-.245.435-.563.81-.957 1.125a4.612 4.612 0 0 1-1.352.743 4.924 4.924 0 0 1-1.607.26c-.807 0-1.508-.15-2.105-.451a4.438 4.438 0 0 1-1.494-1.205 5.38 5.38 0 0 1-.896-1.728 7.08 7.08 0 0 1-.295-2.04v-.421c0-.703.099-1.38.295-2.03a5.362 5.362 0 0 1 .896-1.737 4.438 4.438 0 0 1 1.494-1.205c.597-.302 1.295-.452 2.095-.452.61 0 1.173.097 1.689.291a3.96 3.96 0 0 1 1.352.804c.387.341.691.75.915 1.225.224.469.349.984.376 1.547h-1.169a2.898 2.898 0 0 0-.285-1.135 2.99 2.99 0 0 0-.671-.904 2.975 2.975 0 0 0-.986-.593 3.435 3.435 0 0 0-1.221-.21c-.637 0-1.183.127-1.637.381-.448.254-.814.59-1.098 1.004a4.425 4.425 0 0 0-.631 1.417 6.635 6.635 0 0 0-.193 1.597v.422a6.8 6.8 0 0 0 .193 1.617c.136.53.346 1.001.631 1.416.284.409.65.74 1.098.995.454.254 1.003.381 1.647.381zm13.034-10.255c.306 0 .611.02.916.06.305.034.559.084.763.15l-.153 1.156a9.483 9.483 0 0 0-.854-.14 7.489 7.489 0 0 0-.875-.051c-1.031 0-1.905.241-2.624.723-.718.482-1.223 1.222-1.515 2.22l.01 6.951h-1.26V8.989h1.169l.081 1.888v.221a4.812 4.812 0 0 1 1.78-1.687c.739-.416 1.593-.623 2.562-.623zm7.076 8.86l.223.592 3.977-9.251h1.383l-5.685 12.606c-.149.328-.325.65-.528.964a4.17 4.17 0 0 1-.722.844 3.347 3.347 0 0 1-.967.613 3.124 3.124 0 0 1-1.24.23c-.163 0-.343-.016-.54-.05a4.9 4.9 0 0 1-.498-.09l.142-1.005c.116.014.258.027.428.04.176.02.322.03.436.03.313 0 .598-.06.855-.18a2.42 2.42 0 0 0 .681-.472 3.05 3.05 0 0 0 .529-.643 4.79 4.79 0 0 0 .387-.693l.752-1.607-4.942-10.587h1.373l3.956 8.658zm14.977-3.115c0 .704-.089 1.39-.265 2.06a5.398 5.398 0 0 1-.793 1.767c-.353.51-.8.921-1.343 1.236-.542.308-1.186.462-1.932.462-.685 0-1.311-.13-1.882-.392a3.8 3.8 0 0 1-1.433-1.135v5.505h-1.22V8.989h1.138l.051 1.486c.387-.535.861-.95 1.425-1.245.562-.295 1.195-.442 1.901-.442.752 0 1.403.154 1.952.462.55.301 1 .71 1.353 1.225a5.38 5.38 0 0 1 .783 1.768 8.07 8.07 0 0 1 .265 2.08v.21zm-1.221-.21c0-.543-.061-1.082-.183-1.618a4.47 4.47 0 0 0-.59-1.436 3.174 3.174 0 0 0-1.057-1.035c-.427-.268-.953-.402-1.576-.402-.354 0-.686.05-.997.151a3 3 0 0 0-.845.412 3.372 3.372 0 0 0-.681.633 3.736 3.736 0 0 0-.498.803v5.384a3.283 3.283 0 0 0 1.22 1.336c.529.328 1.136.492 1.821.492.617 0 1.138-.133 1.566-.401a3.196 3.196 0 0 0 1.047-1.035 4.59 4.59 0 0 0 .59-1.446 7.395 7.395 0 0 0 .183-1.628v-.21zm6.597-8.117V8.99h4.078v.984h-4.078v6.84c.007.422.072.774.193 1.055.129.275.299.5.509.673.217.168.467.288.752.362.292.074.607.11.946.11a7.85 7.85 0 0 0 1.037-.07c.36-.047.665-.094.915-.14l.184.913a4.55 4.55 0 0 1-1.068.252c-.421.06-.848.09-1.282.09-.487 0-.939-.06-1.352-.18a2.829 2.829 0 0 1-1.078-.553 2.708 2.708 0 0 1-.722-1.005c-.176-.415-.268-.92-.274-1.517v-6.83h-3.062V8.99h3.062V6.206h1.24zm5.529 8.056a6.716 6.716 0 0 1 .346-2.1 5.349 5.349 0 0 1 .956-1.737 4.63 4.63 0 0 1 1.536-1.195c.61-.295 1.298-.442 2.064-.442.773 0 1.461.147 2.065.442.61.294 1.124.693 1.545 1.195a5.26 5.26 0 0 1 .966 1.738c.224.663.339 1.363.346 2.1v.33a6.715 6.715 0 0 1-.346 2.1 5.229 5.229 0 0 1-.955 1.748c-.421.495-.933.89-1.536 1.185-.603.288-1.292.432-2.065.432-.773 0-1.464-.144-2.075-.432a4.68 4.68 0 0 1-1.535-1.185 5.36 5.36 0 0 1-.966-1.748 6.715 6.715 0 0 1-.346-2.1v-.33zm1.22.332a5.7 5.7 0 0 0 .245 1.667c.162.536.4 1.011.712 1.426.311.409.695.737 1.148.985.462.247.994.371 1.597.371.597 0 1.122-.123 1.577-.371a3.465 3.465 0 0 0 1.149-.985c.311-.415.549-.89.712-1.426a5.696 5.696 0 0 0 .243-1.667v-.332c0-.569-.08-1.122-.243-1.657a4.457 4.457 0 0 0-.712-1.417 3.52 3.52 0 0 0-1.159-.994c-.461-.254-.991-.382-1.587-.382-.597 0-1.125.128-1.586.382a3.55 3.55 0 0 0-1.15.994 4.57 4.57 0 0 0-.701 1.417 5.663 5.663 0 0 0-.245 1.657v.332z" data-color="1"/>
                        <path fill="#ffffff" d="M11.281 24.997c-.9 0-1.799-.228-2.605-.685l-6.07-3.442A5.1 5.1 0 0 1 0 16.439V9.555a5.1 5.1 0 0 1 2.605-4.43l6.071-3.442a5.294 5.294 0 0 1 5.21 0l6.071 3.441a5.164 5.164 0 0 1 1.866 1.804l-7.967 4.586c-1.568.912-2.567 2.636-2.575 4.414v9.07zm11.281-9.742v1.184a5.1 5.1 0 0 1-2.605 4.43l-6.07 3.443c-.17.096-.344.182-.521.258v-2.138a3.128 3.128 0 0 1 1.522-2.64c2.275-1.321 4.566-2.616 6.84-3.938.298-.176.576-.377.834-.599zM22.52 8.9c.029.216.043.435.043.656v1.248c-.005 1.34-.751 2.612-1.903 3.294-2.274 1.322-4.566 2.617-6.84 3.939a5.049 5.049 0 0 0-.453.302v-2.406a3.125 3.125 0 0 1 1.548-2.654L22.521 8.9z" clipRule="evenodd" fillRule="evenodd" data-color="1"/>

                    </g>
                </svg>                                
              </a>
            </div>
            <div>
              <a href="https://helius.xyz/" target="_blank" rel="noopener noreferrer">
                <img src="https://helius.xyz/media/logo.png" alt="helius" />
              </a>
            </div>
            <div>
              <a href="https://quicknode.com/" target="_blank" rel="noopener noreferrer">
                <img src="https://www.quicknode.com/assets/marketing/logos/qn-logo-text-black-50fdc2195e3e63bda28b4eb01bdca6b0ac809be113f64e3fdb4cd910c22ea781.svg" alt="quicknode" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <AnyComponent 
        {...pageProps} 
        handleSearch={(address: string) => setAddress(address)}
        navigation={navigation}
      />

      <ToastContainer
          position="bottom-left"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover={false}
          theme={'colored'}
      />
      
      <DialectProviders>
        <DialectUiManagementProvider>
          <DialectThemeProvider theme="dark" variables={themeVariables}>
            <BottomChatWrapper 
              handleNavigation={setNavigation} 
            />
          </DialectThemeProvider>
        </DialectUiManagementProvider>
      </DialectProviders>
      {/* Footers */}
      {/* <footer>this is a footer</footer> */}
    </div>
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
          crossOrigin=""
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
        
        <link rel="shortcut icon" href="/static/favicon.ico" />
        
        <meta
          name="description"
          content="Solana Profiler by Kida. Discord: Kida#8864, twitter: @darksoulsfanlol"
        />
        <title>Radiance</title>
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
