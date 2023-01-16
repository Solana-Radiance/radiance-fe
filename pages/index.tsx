import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WALLET_BALANCE_QUERY } from '../constants/queries';
import { query } from '../utils/flipside';

const ADDRESS_LENGTH = 44;
const Home = () => {
  const [address, setAddress] = useState("");
  const [isValidAddress, setIsValidAddress] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const lastQueriedAddress = useRef("");

  const onAddressInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let address = e.target.value;
    let isValidAddress = (address.length === ADDRESS_LENGTH || address.length === 0);

    setIsValidAddress(isValidAddress);
    setAddress(address);
  }, []);

  useEffect(() => {
    // dont search twice
    if(isSearching || lastQueriedAddress.current === address) {
      return;
    }

    if(address.length !== ADDRESS_LENGTH) {
      return;
    }
    
    setIsSearching(true);
    lastQueriedAddress.current = address;

    const search = async() => {
      let sql = WALLET_BALANCE_QUERY.replace(/{{address}}/g, address);
      let data = await query(sql);
      console.log(data);
      setIsSearching(false);
    }
    
    search();
  }, [address, isSearching]);

  return (
      <div className='home-page'>
          <strong>Search any address or connect your wallet to get started!</strong>
          <div className='relative'>
            <input type="text" placeholder='Solana Address' value={address} onChange={onAddressInputChange} disabled={isSearching}/>
            {
              !isValidAddress &&
              <i className="fa fa-times"></i>
            }
            {
              isSearching &&
              <i className="fa fa-spin fa-spinner"></i>
            }
          </div>
      </div>
  );
}

export default Home;