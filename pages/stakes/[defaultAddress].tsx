import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { useRouter } from 'next/router';
import { ADDRESS_LENGTH } from '../../constants/numbers';
import { StakeData, StakesProps } from './types';
import { GetProgramAccountsFilter, PublicKey } from '@solana/web3.js';
import { runIfFunction, toLocaleDecimal } from '../../utils/common';
import { useConnection } from '@solana/wallet-adapter-react';import { WALLET_STAKE_SUMMARIES_QUERY } from '../../constants/queries';
import { query } from '../../utils/flipside';
import { MultiBarGraph } from '../../components/MultiBarGraph';
;

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
      let stakeData = await query<StakeData>(stakeSql);
      if(stakeData && stakeData.length > 0) {
        setStakeData(stakeData);
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
          </div>
        </div>
    );
}

export default Stakes;