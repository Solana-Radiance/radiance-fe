import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { GetProgramAccountsFilter, PublicKey } from '@solana/web3.js';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { MultiBarGraph } from '../../components/MultiBarGraph';
import { MultiLineGraph } from '../../components/MultiLineGraph';
import { ADDRESS_LENGTH } from '../../constants/numbers';
import { NFT_TX_QUERY, TOKEN_DETAILS_QUERY, WALLET_BALANCE_QUERY, WALLET_DEFI_RANKING_QUERY, WALLET_NFT_RANKING_QUERY } from '../../constants/queries';
import { ellipsizeThis, runIfFunction, toLocaleDecimal, toShortNumber } from '../../utils/common';
import { query } from '../../utils/flipside';
import { getAddressNames, getAddressNFTs } from '../../utils/helius';
import { NFT } from '../../utils/helius-type';
import { BalanceData, HomeProps, NFTData, RankData, TokenBalances, TokenData } from './types';
import moment from 'moment';
import { useRouter } from 'next/router';
import Link from 'next/link';

const Home = ({ handleSearch }: HomeProps) => {
  const router = useRouter()
  const { defaultAddress } = router.query;
  const [address, setAddress] = useState("");
  const [data, setData] = useState<BalanceData[]>([]);
  const [nftRankData, setNFtRankData] = useState<RankData[]>([]);
  const [volumeRankData, setVolumeRankData] = useState<RankData[]>([]);
  const [nftData, setNFTData] = useState<NFTData[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [nfts, setNFTs] = useState<NFT[]>([]);
  const [activeNFT, setActiveNFT] = useState<NFT>();
  const [tokenBalances, setTokenBalances] = useState<TokenBalances>();

  const [isValidAddress, setIsValidAddress] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isFSQuerying, setIsFSQuerying] = useState(false);
  const lastQueriedAddress = useRef("");
  const {connection} = useConnection();
  const solanaWallet = useWallet();
  

  useEffect(() => {
    if(!defaultAddress) {
      return;
    }
    
    if(typeof defaultAddress === "string") {
      console.log('setting default address: ' + defaultAddress);
      setAddress(defaultAddress);
      handleSearch(defaultAddress);
      return;
    }

    console.log('setting default address');
    setAddress(defaultAddress[0] ?? "");
    console.log('setting default address: ' + (defaultAddress[0] ?? ""));
    handleSearch(defaultAddress[0] ?? "");
  }, [defaultAddress]);

  const onAddressInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let address = e.target.value;
    let isValidAddress = (address.length === ADDRESS_LENGTH || address.length === 0);

    setIsValidAddress(isValidAddress);
    setAddress(address);
  }, []);

  // in case we need to update to show balance for each token
  const dates = useMemo(() => {
    let newDates: string[] = [];
    data.forEach(x => {
      if(!newDates.includes(x.date)) {
        newDates.push(x.date);
      }
    });
    return newDates;
  }, [data]);

  const balances = useMemo(() => {
    return {
      'Total': data.map(x => x.balance_usd)
    };
  }, [data]);

  // get tags
  const defiVolumeTag = useMemo(() => {
    if(!volumeRankData[0]) {
      return 'btm50';
    }

    if(volumeRankData[0].rank_by_volume_pct <= 0.01) {
      return 'top1';
    }
    
    if(volumeRankData[0].rank_by_volume_pct <= 0.05) {
      return 'top5';
    }

    if(volumeRankData[0].rank_by_volume_pct <= 0.10) {
      return 'top10';
    }
    
    if(volumeRankData[0].rank_by_volume_pct <= 0.50) {
      return 'top50';
    }

    return 'btm50';
  }, [volumeRankData]);

  const defiTxTag = useMemo(() => {
    if(!volumeRankData[0]) {
      return 'btm50';
    }

    if(volumeRankData[0].rank_by_tx_count_pct <= 0.01) {
      return 'top1';
    }
    
    if(volumeRankData[0].rank_by_tx_count_pct <= 0.05) {
      return 'top5';
    }

    if(volumeRankData[0].rank_by_tx_count_pct <= 0.10) {
      return 'top10';
    }
    
    if(volumeRankData[0].rank_by_tx_count_pct <= 0.50) {
      return 'top50';
    }

    return 'btm50';
  }, [volumeRankData]);

  const nftVolumeTag = useMemo(() => {
    if(!nftRankData[0]) {
      return 'btm50';
    }

    if(nftRankData[0].rank_by_volume_pct <= 0.01) {
      return 'top1';
    }
    
    if(nftRankData[0].rank_by_volume_pct <= 0.05) {
      return 'top5';
    }

    if(nftRankData[0].rank_by_volume_pct <= 0.10) {
      return 'top10';
    }
    
    if(nftRankData[0].rank_by_volume_pct <= 0.50) {
      return 'top50';
    }

    return 'btm50';
  }, [nftRankData]);

  const nftTxTag = useMemo(() => {
    if(!nftRankData[0]) {
      return 'btm50';
    }

    if(nftRankData[0].rank_by_tx_count_pct <= 0.01) {
      return 'top1';
    }
    
    if(nftRankData[0].rank_by_tx_count_pct <= 0.05) {
      return 'top5';
    }

    if(nftRankData[0].rank_by_tx_count_pct <= 0.10) {
      return 'top10';
    }
    
    if(nftRankData[0].rank_by_tx_count_pct <= 0.50) {
      return 'top50';
    }

    return 'btm50';
  }, [nftRankData]);

  const tokenGraphData = useMemo(() => {
    if(!tokenBalances) {
      return {};
    }

    let graphData: {[name: string]: number[]} = {};
    graphData['Balance (USD)'] = [];
    for(const [tokenAddress, token] of Object.entries(tokenBalances)) {
      graphData['Balance (USD)'].push(token.amount_usd);
    }
    return graphData;
  }, [tokenBalances]);

  const activeNftData = useMemo(() => {
    let filtered = nftData.filter(x => x.mint === activeNFT?.tokenAddress)
    if(!filtered[0]) {
      return undefined;
    }

    let dateStr = moment(filtered[0].block_timestamp).format('YYYY-MM-DD HH:mm:ss');
    let age = moment(filtered[0].block_timestamp).fromNow();

    filtered[0].dateStr = dateStr;
    filtered[0].age = age;

    return filtered[0];
  }, [activeNFT, nftData]);

  useEffect(() => {
    if(!solanaWallet.connected) {
      return;
    }

    // dont override
    if(lastQueriedAddress.current !== "") {
      return;
    }

    setAddress(solanaWallet.publicKey!.toString());
  }, [solanaWallet]);

  useEffect(() => {
    // dont search twice
    if(lastQueriedAddress.current === address && !isSearching) {
      runIfFunction(handleSearch, address);
      return;
    }

    if(isSearching || lastQueriedAddress.current === address) {
      return;
    }

    if(address.length === 0) {
      runIfFunction(handleSearch, address);
      return;
    }

    if(address.length !== ADDRESS_LENGTH) {
      return;
    }
    
    setIsSearching(true);
    //reset
    setData([]);
    setNFtRankData([]);
    setVolumeRankData([]);
    setNames([]);
    setNFTs([]);
    setActiveNFT(undefined);
    setTokenBalances({});

    // only reset layout if it's not searched
    if(!defaultAddress) {
      runIfFunction(handleSearch, "");
    }
    lastQueriedAddress.current = address;

    //get associated token accounts that stores the SPL tokens
    async function getTokenAccounts() {
      try {
        const filters: GetProgramAccountsFilter[] = [
            {
              dataSize: 165,    //size of account (bytes), this is a constant
            },
            {
              memcmp: {
                offset: 32,     //location of our query in the account (bytes)
                bytes: address,  //our search criteria, a base58 encoded string
              },            
            }];
  
        const accounts = await connection.getParsedProgramAccounts(
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), //Associated Tokens Program
            {filters: filters}
        );

        /* accounts.forEach((account, i) => {
            //Parse the account data
            const parsedAccountInfo:any = account.account.data;
            const mintAddress:string = parsedAccountInfo["parsed"]["info"]["mint"];
            const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
            //Log results
            console.log(`Token Account No. ${i + 1}: ${account.pubkey.toString()}`);
            console.log(`--Token Mint: ${mintAddress}`);
            console.log(`--Token Balance: ${tokenBalance}`);
        }); */
        return accounts;
      }

      catch {
        return [];
      }
    }

    //search everything
    const search = async() => {

      // solana has different accounts for every token for a given address
      let accountsRet = await getTokenAccounts();
      let accounts = accountsRet.map(x => x.pubkey.toString());
      accounts.push(address);

      let nonEmptyAccounts = accountsRet.filter((x: any) => x.account.data["parsed"]["info"]["tokenAmount"]["uiAmount"] > 0 && x.account.data["parsed"]["info"]["tokenAmount"]["decimals"] > 0);
      let mints = nonEmptyAccounts.map((x: any) => x.account.data["parsed"]["info"]["mint"]);

      //get names
      let names = await getAddressNames(address);
      setNames(names);

      //get address NFTs
      let nfts = await getAddressNFTs(address);
      nfts = nfts.sort((a,b) => a.collectionName > b.collectionName? 1 : -1);
      setNFTs(nfts);

      //set default NFT
      setActiveNFT(nfts[0]);

      // first search finished, update layout
      setIsSearching(false);
      runIfFunction(handleSearch, address);

      // fs starts querying
      setIsFSQuerying(true);

      let balanceSql = WALLET_BALANCE_QUERY.replace(/{{address}}/g, accounts.join("','"));
      balanceSql = balanceSql.replace(/{{main_address}}/g, address);

      let volumeRankSql = WALLET_DEFI_RANKING_QUERY.replace(/{{address}}/g, address);
      let nftRankSql = WALLET_NFT_RANKING_QUERY.replace(/{{address}}/g, address);
      let tokenDetailsSql = TOKEN_DETAILS_QUERY.replace(/{{address}}/g, mints.join("','"));
      let nftTxSql = NFT_TX_QUERY.replace(/{{address}}/g, address).replace(/{{mints}}/g, nfts.map(x => x.tokenAddress).join("','"));

      let [/* data,  */volumeRankData, nftRankData, tokenData, nftData] = await Promise.all([
        //query<BalanceData>(balanceSql),
        query<RankData>(volumeRankSql),
        query<RankData>(nftRankSql),
        query<TokenData>(tokenDetailsSql),
        query<NFTData>(nftTxSql),
      ]);

      // get all token balances and map them to the result from fs
      let tokenBalances: TokenBalances = {};
      nonEmptyAccounts.forEach((account: any) => {
        let mint: string = account.account.data["parsed"]["info"]["mint"];
        let amount: number = account.account.data["parsed"]["info"]["tokenAmount"]["uiAmount"];
        let token = tokenData?.filter(x => x.token_address === mint)[0];

        if(!tokenBalances[mint]) {
          let name = token && token.symbol? token.symbol : mint.substring(0,3);
          if(token && token.symbol) {

          }
          tokenBalances[mint] = {
            amount: 0,
            amount_usd: 0,
            logo: token?.logo ?? "",
            name,
          };
        }

        tokenBalances[mint].amount += amount;
        tokenBalances[mint].amount_usd += amount * (token?.price ?? 0);
      });
      setTokenBalances(tokenBalances);

      /* if(data) {
        setData(data);
      } */

      if(volumeRankData) {
        setVolumeRankData(volumeRankData);
      }

      if(nftRankData) {
        setNFtRankData(nftRankData);
      }

      if(nftData) {
        setNFTData(nftData);
      }

      //console.log(data);
      //console.log(volumeRankData);
      //console.log(nftRankData);

      setIsFSQuerying(false);

      // may need to cache the data
    }
    
    search();
  }, [address, isSearching]);

  return (
      <div className='home-page'>
          {/** is searching valid address or has a default address */}
          <strong className={!isSearching && address.length === ADDRESS_LENGTH? 'hidden' : ''}>Search any address or connect your wallet to get started!</strong>
          <div className='relative search'>
            <input type="text" placeholder='Solana Address' value={address} onChange={onAddressInputChange} disabled={isSearching || isFSQuerying}/>
            {
              !isValidAddress &&
              <i className="fa fa-times"></i>
            }
            {
              (isSearching || isFSQuerying) &&
              <i className="fa fa-spin fa-spinner"></i>
            }
          </div>
          {/** is searching valid address or has a default address */}
          <div className={`${!isSearching && address.length === ADDRESS_LENGTH? 'flex' : 'hidden'} h-full profile`}>
            <div className="details-container">
              <div className="pfp-container">
                <div className="details-card-container left">
                  <div className="details-card">
                    <span>Swap Volume (USD)</span>
                    <strong>${toShortNumber(volumeRankData[0]?.total_volume ?? 0, 2)}</strong>
                  </div>
                  <div className="details-card">
                    <span>Swap Txs</span>
                    <strong>{toShortNumber(volumeRankData[0]?.total_tx ?? 0, 0)}</strong>
                  </div>
                </div>
                {
                  nfts.length > 0 &&
                  <img src={nfts[0].imageUrl} alt={nfts[0].name} className='pfp'/>
                }
                {
                  nfts.length === 0 &&
                  <div className="pfp">{address.substring(0, 2)}</div>
                }
                <div className="details-card-container right">
                  <div className="details-card">
                    <span>NFT Volume (SOL)</span>
                    <strong>{toShortNumber(nftRankData[0]?.total_volume ?? 0, 2)}</strong>
                  </div>
                  <div className="details-card">
                    <span>NFT Txs</span>
                    <strong>{toShortNumber(nftRankData[0]?.total_tx ?? 0, 0)}</strong>
                  </div>
                </div>

              </div>

              <div className="address-container">
                <strong>{address}</strong>
                {
                  names.length > 0 &&
                  <div className="names-container">
                      <div>AKA</div>
                  {
                    names.map((name, index) => (
                      <span key={`name-${index}-${name}`}>{name}.sol</span>
                    ))
                  }
                  </div>
                }
              </div>

              <div className="tags-container">
                {
                  volumeRankData[0] &&
                  <>
                  <div className={`tag ${defiVolumeTag}`}>{volumeRankData[0].tier_by_volume} Swap Volume</div>
                  <div className={`tag ${defiTxTag}`}>{volumeRankData[0].tier_by_tx_count} Swap Tx</div>
                  </>
                }
                {
                  nftRankData[0] &&
                  <>
                  <div className={`tag ${nftVolumeTag}`}>{nftRankData[0].tier_by_volume} NFT Volume</div>
                  <div className={`tag ${nftTxTag}`}>{nftRankData[0].tier_by_tx_count} NFT Tx</div>
                  </>
                }
              </div>
              {/* <div className="value-over-time-container">
                <div className="title-container">
                  <strong>Value Over Time</strong>
                  <select>
                    <option value="usd">USD</option>
                    <option value="sol">SOL</option>
                  </select>
                </div>
                <div className="graph">
                  <MultiLineGraph
                    dates={dates}
                    data={balances}
                    title=""
                  />
                </div>
              </div> */}
            </div>
            {
              tokenBalances && Object.keys(tokenBalances).length > 0 &&
              <>
                <div className="section-divider">
                  <div className="line"></div>
                  <div className="title">
                    <strong>Balances</strong>
                  </div>
                </div>
                <div className="balances-container">
                  <div className="chart">
                    <MultiBarGraph
                      dates={Object.entries(tokenBalances).map(([token, value]) => value.name)}
                      data={tokenGraphData}
                      title="Token Balances"
                    />
                  </div>
                  <div className="tokens-container">
                    {
                      Object.entries(tokenBalances).map(([token, value]) => (
                        <div className="token" key={`token-${token}`}>
                          <div className="token-image">
                            {
                              value.logo &&
                              <img src={value.logo} alt="token" />
                            }
                            {
                              !value.logo &&
                              <span>{value.name}</span>
                            }
                          </div>
                          {/* <div className="divider"></div> */}
                          <div className="token-balance">
                            <div className="balance">{toShortNumber(value.amount, 2)}</div>
                            <div className="balance-usd">${toShortNumber(value.amount_usd, 2)}</div>
                          </div>
                      </div>
                      ))
                    }
                  </div>
                </div>
              </>
            }
            {
              nfts.length > 0 &&
              <>
                <div className="section-divider">
                  <div className="line"></div>
                  <div className="title">
                    <strong>NFTs</strong>
                  </div>
                </div>
                <div className="nfts-container">
                  <div className="nft-details">
                    <div className="image-container">
                      <img 
                        src={activeNFT?.imageUrl} 
                        alt={'nft'} 
                      />
                    </div>
                    <div className="detail">
                        <strong>{activeNFT?.collectionName}</strong>
                        <strong>{activeNFT?.name}</strong>
                        <div>
                          <div>
                            <i className="fa fa-calendar"></i>
                          </div>
                          {
                            isFSQuerying? 'Loading..' : activeNftData?.dateStr
                          }
                        </div>
                        <div>
                          <div>
                            <i className="fa fa-clock"></i>
                          </div>
                          {
                            isFSQuerying? 'Loading..' : activeNftData?.age
                          }
                        </div>
                        <div>
                          <div>
                            <i className="fa fa-truck"></i>
                          </div>
                          {
                            isFSQuerying? 'Loading..' : activeNftData?.obtained_by
                          }
                        </div>
                        <div>
                          <div>
                            <i className="fa fa-dollar-sign"></i>
                          </div>
                          {
                            isFSQuerying? 'Loading..' : `$${toLocaleDecimal(activeNftData?.amount_usd ?? 0, 2, 2)} (${activeNftData?.amount_currency ?? "0"} ${activeNftData?.currency ?? "SOL"})`
                          }
                        </div>
                        <div>
                          <div>
                            <i className="fa fa-tag"></i>
                          </div>
                          
                          {
                            isFSQuerying? 'Loading..' : <Link href={`https://solana.fm/tx/${activeNftData?.tx_id}`} target="_blank" rel="noopener noreferrer">{ellipsizeThis(activeNftData?.tx_id ?? "", 4, 4)}</Link> 
                          }
                        </div>
                    </div>
                  </div>
                  <div className="nft-list">
                    {
                      nfts.map((nft) => (
                        <button className="nft" key={nft.tokenAddress} onClick={() => setActiveNFT(nft)}>
                          <div className="nft-image">
                            <img 
                              src={nft.imageUrl} 
                              alt={'nft'} 
                            />
                          </div>
                          <div className="nft-name">
                            <strong>{nft.collectionName}</strong>
                            <div>{nft.name}</div>
                          </div>
                        </button>
                      ))
                    }
                  </div>
                </div>
              </>
            }
          </div>
      </div>
  );
}

export default Home;