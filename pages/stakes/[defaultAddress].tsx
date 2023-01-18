import React, {useCallback, useEffect, useRef, useState} from 'react';
import { useRouter } from 'next/router';
import { ADDRESS_LENGTH } from '../../constants/numbers';
import { StakesProps } from './types';
import { GetProgramAccountsFilter, PublicKey } from '@solana/web3.js';
import { runIfFunction } from '../../utils/common';
import { useConnection } from '@solana/wallet-adapter-react';

const Stakes = ({ handleSearch }: StakesProps) => {
    const router = useRouter()
    const { defaultAddress } = router.query;

    const [address, setAddress] = useState("");
    const [isValidAddress, setIsValidAddress] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [isFSQuerying, setIsFSQuering] = useState(false);
    const lastQueriedAddress = useRef("");
    const {connection} = useConnection();

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

        // reset layout
        runIfFunction(handleSearch, "");
        lastQueriedAddress.current = address;

        //search everything
        const search = async() => {
        //reset

        // first search finished, update layout
        setIsSearching(false);
        runIfFunction(handleSearch, address);
        

        setIsFSQuering(false);

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
        </div>
    );
}

export default Stakes;