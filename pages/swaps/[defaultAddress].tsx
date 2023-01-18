import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { useRouter } from 'next/router';
import { ADDRESS_LENGTH } from '../../constants/numbers';
import { SwapsProps, VolumeData } from './types';
import { GetProgramAccountsFilter, PublicKey } from '@solana/web3.js';
import { runIfFunction } from '../../utils/common';
import { useConnection } from '@solana/wallet-adapter-react';
import { WALLET_DEFI_VOLUME_QUERY } from '../../constants/queries';
import { query } from '../../utils/flipside';
import { MultiBarGraph } from '../../components/MultiBarGraph';

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

    const onAddressInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      let address = e.target.value;
      let isValidAddress = (address.length === ADDRESS_LENGTH || address.length === 0);
  
      setIsValidAddress(isValidAddress);
      setAddress(address);
    }, []);

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
        let volumeData = await query<VolumeData>(volumeSql);

        if(volumeData) {
          setVolumeData(volumeData);
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
          </div>
        </div>
    );
}

export default Swaps;