import { NextComponentType, NextPageContext } from "next";

export interface LayoutProps {
    Component: NextComponentType<NextPageContext, any, any>;
    pageProps: any;
}

export interface BaseProps {
    handleSearch: (address: string) => void;
}

export interface BottomChatWrapperProps {
    handleNavigation: ({
        navigation,
        open
    }: {
        navigation: any;  /* not exported */
        open: () => void;
    }) => void;
}