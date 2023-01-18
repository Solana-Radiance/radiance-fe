export type HeliusNameResponse = {
    domainNames: string[];
}

export type HeliusNFTResponse = {
    nfts: NFT[];
}

export type NFT = {
    name: string;
    tokenAddress: string;
    collectionName: string;
    collectionAddress: string;
    imageUrl: string;
    traits: NFTTrait[];
}

export type NFTTrait = {
    trait_type: string;
    value: string;
}
