import { NextComponentType, NextPageContext } from "next";

export interface LayoutProps {
    Component: NextComponentType<NextPageContext, any, any>;
    pageProps: any;
}

export interface BaseProps {
    handleSearch: (address: string) => void;
}