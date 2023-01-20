import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { useRouter } from 'next/router';
import { MAX_ADDRESS_LENGTH, MIN_ADDRESS_LENGTH, NFT_DATA_PER_PAGE } from '../../constants/numbers';
import { NftMetadata, NftsProps, TxData, VolumeData } from './types';
import { GetProgramAccountsFilter, PublicKey } from '@solana/web3.js';
import { ellipsizeThis, runIfFunction, toLocaleDecimal, toShortNumber } from '../../utils/common';
import { useConnection } from '@solana/wallet-adapter-react';
import { WALLET_NFT_TXS_QUERY, WALLET_NFT_VOLUME_QUERY } from '../../constants/queries';
import { query } from '../../utils/flipside';
import { MultiBarGraph } from '../../components/MultiBarGraph';
import { CSVLink } from 'react-csv';
import moment from 'moment';
import axios, { AxiosResponse } from 'axios';

const Nfts = ({ handleSearch }: NftsProps) => {
    const router = useRouter()
    const { defaultAddress } = router.query;

    const [address, setAddress] = useState("");
    const [isValidAddress, setIsValidAddress] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [isFSQuerying, setIsFSQuerying] = useState(false);
    const lastQueriedAddress = useRef("");
    const {connection} = useConnection();

    const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
    const [txData, setTxData] = useState<TxData[]>([]);
    const [txPage, setTxPage] = useState(0);
    const [nftMetadata, setNFTMetadata] = useState<NftMetadata[]>([]);

    const onAddressInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      let address = e.target.value;
      let isValidAddress = ((address.length >= MIN_ADDRESS_LENGTH && address.length <= MAX_ADDRESS_LENGTH) || address.length === 0);
  
      setIsValidAddress(isValidAddress);
      setAddress(address);
    }, []);

    const filteredTxs = useMemo(() => {
      let newData = [];
      for(var i = txPage * NFT_DATA_PER_PAGE; i < (txPage + 1) * NFT_DATA_PER_PAGE; i++) {
        if(i === txData.length) {
          //end of data
          break;
        }
        newData.push(txData[i]);
      }
      return newData;
    }, [txData, txPage]);

    const csvData = useMemo(() => {
      let newData = [
        [
          'block_timestamp',
          'tx_id',
          'tx_from',
          'tx_to',
          'mint',
          'obtained_by',
          'currency',
          'amount_currency',
          'amount_usd',
        ]
      ];
      txData.forEach(x => {
        newData.push([
          x.block_timestamp,
          x.tx_id,
          x.tx_from,
          x.tx_to,
          x.mint,
          x.obtained_by,
          x.currency,
          x.amount_currency.toString(),
          x.amount_usd.toString(),
        ]);
      });
      return newData;
    }, [txData]);

    const onLeftClick = useCallback(() => {
      let newPage = txPage - 1;
      if(newPage >= 0) {
        setTxPage(newPage);
      }
    }, [txPage]);

    const onRightClick = useCallback(() => {
      let newPage = txPage + 1;
      let maxPage = Math.floor(txData.length / NFT_DATA_PER_PAGE);
      if(newPage <= maxPage) {
        setTxPage(newPage);
      }
    }, [txPage, txData]);

    // graph data
    const volumeGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Volume (SOL)'] = volumeData.map(x => x.total_volume_sol);
      return graphData;
    }, [volumeData]);

    const cumulativeVolumeGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Cumulative Volume (SOL)'] = volumeData.map(x => x.cumulative_volume_sol);
      return graphData;
    }, [volumeData]);

    const volumeUsdGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Volume (USD)'] = volumeData.map(x => x.total_volume_usd);
      return graphData;
    }, [volumeData]);

    const cumulativeUsdVolumeGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Cumulative Volume (USD)'] = volumeData.map(x => x.cumulative_volume_usd);
      return graphData;
    }, [volumeData]);

    const profitGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Profit (SOL)'] = volumeData.map(x => x.total_profit_sol);
      return graphData;
    }, [volumeData]);

    const cumulativeProfitGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Cumulative Profit (SOL)'] = volumeData.map(x => x.cumulative_profit_sol);
      return graphData;
    }, [volumeData]);

    const profitUsdGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Profit (USD)'] = volumeData.map(x => x.total_profit_usd);
      return graphData;
    }, [volumeData]);

    const cumulativeProfitUsdGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Cumulative Profit (USD)'] = volumeData.map(x => x.cumulative_profit_usd);
      return graphData;
    }, [volumeData]);

    const txGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Tx Count'] = volumeData.map(x => x.total_tx);
      return graphData;
    }, [volumeData]);

    const cumulativeTxGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Cumulative Tx Count'] = volumeData.map(x => x.cumulative_tx);
      return graphData;
    }, [volumeData]);

    // end get graph data

    useEffect(() => {
      if(typeof defaultAddress !== "string") {
        return;
      }

      setAddress(defaultAddress ?? "");
      handleSearch(defaultAddress ?? "");
    }, [defaultAddress]);
    

    useEffect(() => {
        // dont search twice
        if(lastQueriedAddress.current === address && !isSearching) {
          runIfFunction(handleSearch, address);
        }

        if(isSearching || lastQueriedAddress.current === address) {
          return;
        }

        if(address.length === 0) {
          runIfFunction(handleSearch, address);
          return;
        }

        if(address.length < MIN_ADDRESS_LENGTH) {
          return;
        }

        if(address.length > MAX_ADDRESS_LENGTH) {
          return;
        }
        
        setIsSearching(true);
        //reset
        setVolumeData([]);
        setTxData([]);
        setNFTMetadata([]); 

        // reset layout
        runIfFunction(handleSearch, "");
        lastQueriedAddress.current = address;

        //search everything
        const search = async() => {

            // first search finished, update layout
            setIsSearching(false);
            setIsFSQuerying(true);
            runIfFunction(handleSearch, address);
            
            let volumeSql = WALLET_NFT_VOLUME_QUERY.replace(/{{address}}/g, address);
            let txSql = WALLET_NFT_TXS_QUERY.replace(/{{address}}/g, address);
            let [volumeData, txData] = await Promise.all([
              query<VolumeData>(volumeSql),
              query<TxData>(txSql),
            ]);

            if(volumeData) {
              setVolumeData(volumeData);
            }

            if(txData) {
              setTxData(txData);

              let mints: string[] = [];
              txData.forEach(tx => {
                if(mints.length > 99) {
                  return;
                }

                if(!mints.includes(tx.mint)) {
                  mints.push(tx.mint);
                }
              });

              console.log(mints);

              let { data } = await axios.post<any, AxiosResponse<NftMetadata[]>>('https://api.helius.xyz/v0/tokens/metadata?api-key=c70d5ca6-cb12-4a4f-a827-ee646212f344', {
                mintAccounts: mints,
              });

              setNFTMetadata(data);
            }

            setIsFSQuerying(false);

            // may need to cache the data
        }
        
        search();
    }, [address, isSearching]);

    return (
        <div className='nfts-page'>
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
          <div className={`flex h-full profile`}>
              {/** SOL */}
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Volume (SOL)"
                    dates={volumeData.map(x => x.date)}
                    data={volumeGraphData}
                  />
                </div>
              </div>
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Cumulative Volume (SOL)"
                    dates={volumeData.map(x => x.date)}
                    data={cumulativeVolumeGraphData}
                  />
                </div>
              </div>
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Profit (SOL)"
                    dates={volumeData.map(x => x.date)}
                    data={profitGraphData}
                  />
                </div>
              </div>
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Cumulative Profit (SOL)"
                    dates={volumeData.map(x => x.date)}
                    data={cumulativeProfitGraphData}
                  />
                </div>
              </div>

              {/** USD */}
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Volume (USD)"
                    dates={volumeData.map(x => x.date)}
                    data={volumeUsdGraphData}
                  />
                </div>
              </div>
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Cumulative Volume (USD)"
                    dates={volumeData.map(x => x.date)}
                    data={cumulativeUsdVolumeGraphData}
                  />
                </div>
              </div>
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Profit (USD)"
                    dates={volumeData.map(x => x.date)}
                    data={profitUsdGraphData}
                  />
                </div>
              </div>
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Cumulative Profit (USD)"
                    dates={volumeData.map(x => x.date)}
                    data={cumulativeProfitUsdGraphData}
                  />
                </div>
              </div>

              {/** Tx */}
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Tx Count"
                    dates={volumeData.map(x => x.date)}
                    data={txGraphData}
                  />
                </div>
              </div>
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Cumulative Tx Count"
                    dates={volumeData.map(x => x.date)}
                    data={cumulativeTxGraphData}
                  />
                </div>
              </div>
            <div className="table-container">
              <div className="flex justify-between text-xl">
                <strong>Transactions</strong>
                <CSVLink className="btn btn-lg btn-info mt-2 max-width-button" data={csvData} filename={'nfts.csv'} target="_blank">Download</CSVLink>
              </div>
              <div className='table'>
                <table>
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Date</th>
                      <th>Tx ID</th>
                      <th>Type</th>
                      <th>Currency</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                      {
                        filteredTxs.length > 0 &&
                        filteredTxs.map((x, index) => (
                          <tr key={x.tx_id + index.toString()} className='h-[90px]'>
                            <td className='text-center'>
                              <a href={`https://solana.fm/address/${x.mint}`} target="_blank" rel="noopener noreferrer">
                                {
                                  nftMetadata.filter(d => d.mint === x.mint).length > 0 && nftMetadata.filter(d => d.mint === x.mint)[0].offChainData?.image?
                                  <div className="flex flex-col p-5">
                                    <img src={ nftMetadata.filter(d => d.mint === x.mint)[0].offChainData.image } alt="nft" />
                                    <strong>{ nftMetadata.filter(d => d.mint === x.mint)[0].offChainData.name }</strong>
                                  </div> :
                                  ellipsizeThis(x.mint, 4, 4)
                                }
                              </a>
                            </td>
                            <td className='text-center'>{moment(x.block_timestamp).format('YYYY-MM-DD HH:mm:ss')}</td>
                            <td className='text-center'><a href={`https://solana.fm/tx/${x.tx_id}`} target="_blank" rel="noopener noreferrer">{ellipsizeThis(x.tx_id, 4, 4)}</a></td>
                            <td className='text-center'>{x.obtained_by}</td>
                            <td className='text-center'>{x.currency}</td>
                            <td className='text-center'>
                              <div className="flex flex-col">
                                <strong>{toShortNumber(x.amount_currency, 2)}</strong>
                                <strong>(${toShortNumber(x.amount_usd, 2)})</strong>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                  </tbody>
                </table>
              </div>
              <div className='flex w-[100px] justify-between ml-5 mt-3'>
                <button onClick={onLeftClick}>
                  <i className="fa fa-chevron-left"></i>
                </button>
                <span>{txPage + 1} / {Math.floor(txData.length / NFT_DATA_PER_PAGE) + 1}</span>
                <button onClick={onRightClick}>
                  <i className="fa fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
    );
}

export default Nfts;