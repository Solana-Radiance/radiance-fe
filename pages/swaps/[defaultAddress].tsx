import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { useRouter } from 'next/router';
import { ADDRESS_LENGTH, DATA_PER_PAGE } from '../../constants/numbers';
import { SwapsProps, TxData, VolumeData } from './types';
import { GetProgramAccountsFilter, PublicKey } from '@solana/web3.js';
import { ellipsizeThis, runIfFunction, toLocaleDecimal, toShortNumber } from '../../utils/common';
import { useConnection } from '@solana/wallet-adapter-react';
import { WALLET_DEFI_TXS_QUERY, WALLET_DEFI_VOLUME_QUERY } from '../../constants/queries';
import { query } from '../../utils/flipside';
import { MultiBarGraph } from '../../components/MultiBarGraph';
import { CSVLink } from 'react-csv';
import moment from 'moment';

const Swaps = ({ handleSearch }: SwapsProps) => {
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

    const onAddressInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      let address = e.target.value;
      let isValidAddress = (address.length === ADDRESS_LENGTH || address.length === 0);
  
      setIsValidAddress(isValidAddress);
      setAddress(address);
    }, []);

    const filteredTxs = useMemo(() => {
      let newData = [];
      for(var i = txPage * DATA_PER_PAGE; i < (txPage + 1) * DATA_PER_PAGE; i++) {
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
          'symbol_from',
          'symbol_to',
          'swap_from_amount',
          'swap_from_amount_usd',
          'swap_to_amount',
          'swap_to_amount_usd',
          'profit_usd',
        ]
      ];
      txData.forEach(x => {
        newData.push([
          x.block_timestamp,
          x.tx_id,
          x.symbol_from,
          x.symbol_to,
          x.swap_from_amount.toString(),
          x.swap_from_amount_usd.toString(),
          x.swap_to_amount.toString(),
          x.swap_to_amount_usd.toString(),
          x.profit_usd.toString(),
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
      let maxPage = Math.floor(txData.length / DATA_PER_PAGE);
      if(newPage <= maxPage) {
        setTxPage(newPage);
      }
    }, [txPage, txData]);

    useEffect(() => {
      if(typeof defaultAddress !== "string") {
        return;
      }

      setAddress(defaultAddress ?? "");
      handleSearch(defaultAddress ?? "");
    }, [defaultAddress]);
    

    // graph data
    const volumeGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Volume (USD)'] = volumeData.map(x => x.total_volume);
      return graphData;
    }, [volumeData]);

    const cumulativeVolumeGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Cumulative Volume (USD)'] = volumeData.map(x => x.cumulative_volume);
      return graphData;
    }, [volumeData]);

    const profitGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Profit (USD)'] = volumeData.map(x => x.total_profit);
      return graphData;
    }, [volumeData]);

    const cumulativeProfitGraphData = useMemo(() => {
      if(!volumeData || volumeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};
      graphData['Cumulative Profit (USD)'] = volumeData.map(x => x.cumulative_profit);
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

      if(address.length !== ADDRESS_LENGTH) {
        return;
      }
      
      setIsSearching(true);

      //reset
      setVolumeData([]);
      setTxData([]);
      setTxPage(0);

      // reset layout
      runIfFunction(handleSearch, "");
      lastQueriedAddress.current = address;

      //search everything
      const search = async() => {

        // first search finished, update layout
        setIsSearching(false);
        setIsFSQuerying(true);
        runIfFunction(handleSearch, address);
        
        let volumeSql = WALLET_DEFI_VOLUME_QUERY.replace(/{{address}}/g, address);
        let txsSql = WALLET_DEFI_TXS_QUERY.replace(/{{address}}/g, address);
        let [volumeData, txData] = await Promise.all([
          query<VolumeData>(volumeSql),
          query<TxData>(txsSql)
        ]);

        if(volumeData) {
          setVolumeData(volumeData);
        }

        if(txData) {
          setTxData(txData);
        }

        setIsFSQuerying(false);

        // may need to cache the data
      }
      
      search();
    }, [address, isSearching]);

    return (
        <div className='swaps-page'>
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
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Volume"
                    dates={volumeData.map(x => x.date)}
                    data={volumeGraphData}
                  />
                </div>
              </div>
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Cumulative Volume"
                    dates={volumeData.map(x => x.date)}
                    data={cumulativeVolumeGraphData}
                  />
                </div>
              </div>
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Profit"
                    dates={volumeData.map(x => x.date)}
                    data={profitGraphData}
                  />
                </div>
              </div>
              <div className="graph-container">
                <div className="graph">
                  <MultiBarGraph
                    title="Cumulative Profit"
                    dates={volumeData.map(x => x.date)}
                    data={cumulativeProfitGraphData}
                  />
                </div>
              </div>
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
                  <CSVLink className="btn btn-lg btn-info mt-2 max-width-button" data={csvData} filename={'swaps.csv'} target="_blank">Download</CSVLink>
                </div>
                <div className='table'>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Tx ID</th>
                        <th>Details</th>
                        <th>Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                        {
                          filteredTxs.length > 0 &&
                          filteredTxs.map((x, index) => (
                            <tr key={x.tx_id + index.toString()} className='h-[90px]'>
                              <td className='text-center'>{moment(x.block_timestamp).format('YYYY-MM-DD HH:mm:ss')}</td>
                              <td className='text-center'><a href={`https://solana.fm/tx/${x.tx_id}`} target="_blank" rel="noopener noreferrer">{ellipsizeThis(x.tx_id, 4, 4)}</a></td>
                              <td className='text-center'>
                                <div className='flex items-center justify-center'>
                                  <div className='flex flex-col w-[200px]'>
                                    <span>{toShortNumber(x.swap_from_amount, 2)} <strong>{ellipsizeThis(x.symbol_from, 4, 4)}</strong></span>
                                    <span>${toLocaleDecimal(x.swap_from_amount_usd, 2, 2)}</span>
                                  </div>
                                  <span>➜</span>
                                  <div className='flex flex-col w-[200px]'>
                                    <span>{toShortNumber(x.swap_to_amount, 2)} <strong>{ellipsizeThis(x.symbol_to, 4, 4)}</strong></span>
                                    <span>${toLocaleDecimal(x.swap_to_amount_usd, 2, 2)}</span>
                                  </div>
                                </div>
                              </td>
                              <td className='text-center'><strong className={`${x.profit_usd < 0? 'text-red-300' : 'text-green-300'}`}>{x.profit_usd < 0? '-' : ''}${toLocaleDecimal(Math.abs(x.profit_usd), 2, 2)}</strong></td>
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
                  <span>{txPage + 1} / {Math.floor(txData.length / DATA_PER_PAGE) + 1}</span>
                  <button onClick={onRightClick}>
                    <i className="fa fa-chevron-right"></i>
                  </button>
                </div>
              </div>
          </div>
        </div>
    );
}

export default Swaps;