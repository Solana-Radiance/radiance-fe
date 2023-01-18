import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { useRouter } from 'next/router';
import { ADDRESS_LENGTH, DATA_PER_PAGE } from '../../constants/numbers';
import { StakeData, StakesProps, TxData } from './types';
import { GetProgramAccountsFilter, PublicKey } from '@solana/web3.js';
import { ellipsizeThis, runIfFunction, toLocaleDecimal, toShortNumber } from '../../utils/common';
import { useConnection } from '@solana/wallet-adapter-react';import { WALLET_STAKE_SUMMARIES_QUERY, WALLET_STAKE_TXS_QUERY } from '../../constants/queries';
import { query } from '../../utils/flipside';
import { MultiBarGraph } from '../../components/MultiBarGraph';
import { CSVLink } from 'react-csv';
import moment from 'moment';

const STAKE_PROGRAM_PK = new PublicKey('Stake11111111111111111111111111111111111111');
const WALLET_OFFSET = 44;
const DATA_SIZE = 200;

const Stakes = ({ handleSearch }: StakesProps) => {
    const router = useRouter()
    const { defaultAddress } = router.query;

    const [address, setAddress] = useState("");
    const [isValidAddress, setIsValidAddress] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [isFSQuerying, setIsFSQuerying] = useState(false);
    const lastQueriedAddress = useRef("");
    const {connection} = useConnection();

    const [stakeData, setStakeData] = useState<StakeData[]>([]);
    const [stakedSols, setStakedSols] = useState(0);
    const [txData, setTxData] = useState<TxData[]>([]);
    const [txPage, setTxPage] = useState(0);

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
          'index',
          'event_type',
          'stake_account',
          'pre_tx_staked_balance_adj',
          'post_tx_staked_balance_adj',
          'net_deposit_amount',
        ]
      ];
      txData.forEach(x => {
        newData.push([
          x.block_timestamp,
          x.tx_id,
          x.index.toString(),
          x.event_type,
          x.stake_account,
          x.pre_tx_staked_balance_adj.toString(),
          x.post_tx_staked_balance_adj.toString(),
          x.net_deposit_amount.toString(),
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

    const stakeInterest = useMemo(() => {
      if(!stakeData || stakeData.length === 0) {
        return 0;
      }
  
      let lastBalance = stakeData[stakeData.length - 1].total_stake_balance;
      return stakedSols - lastBalance;
    }, [stakeData, stakedSols]);

    // graph data
    const stakeGraphData = useMemo(() => {
      if(!stakeData || stakeData.length === 0) {
        return {};
      }
  
      let graphData: {[name: string]: number[]} = {};

      // a lil bit of inaccuracy here as we add total interest to all the balances
      graphData['Staked (SOL)'] = stakeData.map(x => x.total_stake_balance + stakeInterest);
      return graphData;
    }, [stakeData, stakedSols, stakeInterest]);

    // end get graph data
    
    useEffect(() => {
      if(typeof defaultAddress !== "string") {
        return;
      }

      setAddress(defaultAddress ?? "");
      handleSearch(defaultAddress ?? "");
    }, [defaultAddress]);

    const onAddressInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      let address = e.target.value;
      let isValidAddress = (address.length === ADDRESS_LENGTH || address.length === 0);
  
      setIsValidAddress(isValidAddress);
      setAddress(address);
    }, []);
    

  useEffect(() => {
    // dont search twice
    if(lastQueriedAddress.current === address && !isSearching) {
      return;
    }

    if(isSearching || lastQueriedAddress.current === address) {
      return;
    }

    if(address.length !== ADDRESS_LENGTH) {
      return;
    }
    
    setIsSearching(true);

    //reset
    setStakeData([]);
    setStakedSols(0);

    lastQueriedAddress.current = address;

    //get all stake accounts and their balances
    async function getStakeAccounts() {
      const stakeAccounts = await connection.getParsedProgramAccounts(
          STAKE_PROGRAM_PK, {
          filters: [
              {
                dataSize: DATA_SIZE, // number of bytes
              },
              {
                memcmp: {
                  offset: WALLET_OFFSET, // number of bytes
                  bytes: address, // base58 encoded string
                },
              },
            ]
          }
      );
      return stakeAccounts;
    }

    //search everything
    const search = async() => {
      let stakeAccounts = await getStakeAccounts();
      let stakedSolsArr = stakeAccounts.map((x: any) => x.account.data.parsed.info.stake.delegation.stake / 1e9);
      let stakedSols = 0;

      if(stakedSolsArr.length > 0) {
        stakedSols = stakedSolsArr.reduce((a: number, b : number) => (
          a + b
        ));
      }

      setStakedSols(stakedSols);

      // first search finished, update layout
      setIsSearching(false);
      setIsFSQuerying(true);

      let stakeSql = WALLET_STAKE_SUMMARIES_QUERY.replace(/{{address}}/g, address);
      let txSql = WALLET_STAKE_TXS_QUERY.replace(/{{address}}/g, address);
      let [stakeData, txData] = await Promise.all([
        query<StakeData>(stakeSql),
        query<TxData>(txSql),
      ]);

      if(stakeData && stakeData.length > 0) {
        setStakeData(stakeData);
      }

      if(txData && txData.length > 0) {
        setTxData(txData);
      }

      runIfFunction(handleSearch, address);
      
      setIsFSQuerying(false);

      // may need to cache the data
    }
    
    search();
  }, [address, isSearching]);

    return (
        <div className='stakes-page'>
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
            <div className="total-interest-container">
              <span>Total Interest Accumulated (SOL)</span>
              <strong>{toLocaleDecimal(stakeInterest, 2, 2)}</strong>
            </div>
            <div className="graph-container">
              <div className="graph">
                <MultiBarGraph
                  title="Staked (SOL)"
                  dates={stakeData.map(x => x.date)}
                  data={stakeGraphData}
                />
              </div>
            </div>
              <div className="table-container">
                <div className="flex justify-between text-xl">
                  <strong>Transactions</strong>
                  <CSVLink className="btn btn-lg btn-info mt-2 max-width-button" data={csvData} filename={'stakes.csv'} target="_blank">Download</CSVLink>
                </div>
                <div className='table'>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Tx ID</th>
                        <th>Type</th>
                        <th>Details</th>
                        <th>Net</th>
                      </tr>
                    </thead>
                    <tbody>
                        {
                          filteredTxs.length > 0 &&
                          filteredTxs.map(x => (
                            <tr key={x.tx_id} className='h-[90px]'>
                              <td className='text-center'>{moment(x.block_timestamp).format('YYYY-MM-DD HH:mm:ss')}</td>
                              <td className='text-center'><a href={`https://solana.fm/tx/${x.tx_id}`} target="_blank" rel="noopener noreferrer">{ellipsizeThis(x.tx_id, 4, 4)}</a></td>
                              <td className='text-center'><strong className={`${x.net_deposit_amount < 0? 'text-red-300' : 'text-green-300'}`}>{x.event_type}</strong></td>
                              <td className='text-center'>
                                <div className='flex items-center justify-center'>
                                  <div className='flex flex-col w-[200px]'>
                                    <span>{toShortNumber(x.pre_tx_staked_balance_adj, 2)} <strong>SOL</strong></span>
                                  </div>
                                  <span>➜</span>
                                  <div className='flex flex-col w-[200px]'>
                                    <span>{toShortNumber(x.post_tx_staked_balance_adj, 2)} <strong>SOL</strong></span>
                                  </div>
                                </div>
                              </td>
                              <td className='text-center'><strong className={`${x.net_deposit_amount < 0? 'text-red-300' : 'text-green-300'}`}>{toLocaleDecimal(x.net_deposit_amount, 2, 2)}</strong></td>
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

export default Stakes;