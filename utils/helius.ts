import axios, { AxiosResponse } from 'axios';
import { HeliusNameResponse, HeliusNFTResponse } from './helius-type';

const instance = axios.create({
    baseURL: 'https://api.helius.xyz'
});

export const getAddressNames = async(address: string) => {
    try {
        let { data } = await instance.get<any, AxiosResponse<HeliusNameResponse>>(`/v0/addresses/${address}/names?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`);
        return data.domainNames;
    }

    catch {
        return [];
    }
}

export const getAddressNFTs = async(address: string) => {
    try {
        let { data } = await instance.get<any, AxiosResponse<HeliusNFTResponse>>(`/v0/addresses/${address}/nfts?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`);
        return data.nfts;
    }

    catch {
        return [];
    }
}