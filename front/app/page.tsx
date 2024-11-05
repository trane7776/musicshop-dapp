'use client';

import React, { use, useEffect } from 'react';

import { ethers } from 'ethers';
import { MusicShop__factory } from '@/typechain';
import type { MusicShop } from '@/typechain';
import type { BrowserProvider } from 'ethers';
import { initialize } from 'next/dist/server/lib/render-server';
import { ConnectWallet } from '@/components/ConnectWallet';
import { WaitingMessage } from '@/components/WaitingMessage';
import { ErrorMessage } from '@/components/ErrorMessage';

const HARDHAT_NETWORK_ID = '0x7a69'; // 31337
const MUSIC_SHOP_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

declare let window: any;

interface CurrentConnectionProps {
  provider?: BrowserProvider;
  shop?: MusicShop;
  signer?: ethers.JsonRpcSigner;
}

export default function Home() {
  const [networkError, setNetworkError] = React.useState<string>();
  const [txBeingSent, setTxBeingSent] = React.useState<string>();

  const [transactionError, setTransactionError] = React.useState<any>();
  const [currentBalance, setCurrentBalance] = React.useState<string>();
  const [isOwner, setIsOwner] = React.useState<boolean>(false);
  const [currentConnection, setCurrentConnection] =
    React.useState<CurrentConnectionProps>();

  useEffect(() => {
    (async () => {
      if (currentConnection?.shop && currentConnection?.signer) {
        setIsOwner(
          (await currentConnection.shop.owner()) ===
            currentConnection.signer.address
        );
      }
    })();
  }, [currentConnection]);

  useEffect(() => {
    (async () => {
      if (currentConnection?.provider && currentConnection?.signer) {
        setCurrentBalance(
          String(
            await currentConnection.provider.getBalance(
              currentConnection.signer.address
            )
          )
        );
      }
    })();
  }, [currentConnection, txBeingSent]);

  const initialize = async (address: string) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner(address);
    setCurrentConnection({
      ...currentConnection,
      provider,
      signer,
      shop: MusicShop__factory.connect(MUSIC_SHOP_ADDRESS, signer),
    });
  };

  const resetState = () => {
    setTxBeingSent(undefined);
    setTransactionError(undefined);
    setCurrentBalance(undefined);
    setIsOwner(false);

    setCurrentConnection({
      provider: undefined,
      shop: undefined,
      signer: undefined,
    });
    setNetworkError(undefined);
  };

  const connectWallet = async () => {
    if (window.ethereum === undefined) {
      setNetworkError('Please install MetaMask');
      return;
    }

    if (!(await checkNetwork())) {
      return;
    }

    const [selectedAccount] = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    initialize(ethers.getAddress(selectedAccount));

    window.ethereum.on('accountsChanged', ([newAccount]: string[]) => {
      if (newAccount === undefined) {
        return resetState();
      }
      initialize(ethers.getAddress(newAccount));
    });

    window.ethereum.on('chainChanged', async () => {
      resetState();
    });
  };

  const checkNetwork = async (): Promise<boolean> => {
    const chosenChainId = await window.ethereum.request({
      method: 'eth_chainId',
    });

    if (chosenChainId === HARDHAT_NETWORK_ID) {
      return true;
    }

    setNetworkError(
      'Please switch to localhost Hardhat network in MetaMask and try again'
    );

    return false;
  };

  const dismissNetworkError = () => {
    setNetworkError(undefined);
  };

  const dismissTransactionError = () => {
    setTransactionError(undefined);
  };

  const getRpcErrorMessage = (error: any): string => {
    console.log(error);
    if (error.data) {
      return error.data.message;
    }
    return error.message;
  };

  return (
    <main>
      {!currentConnection?.signer && (
        <ConnectWallet
          connectWallet={connectWallet}
          dismiss={dismissNetworkError}
          networkError={networkError}
        />
      )}
      {currentConnection?.signer && (
        <p>Your address: {currentConnection.signer.address}</p>
      )}

      {txBeingSent && <WaitingMessage txHash={txBeingSent} />}

      {transactionError && (
        <ErrorMessage
          message={getRpcErrorMessage(transactionError)}
          dismiss={dismissTransactionError}
        />
      )}
      {currentBalance && (
        <p>Your balance: {ethers.formatEther(currentBalance)} ETH</p>
      )}

      {isOwner && !txBeingSent && <form action=""></form>}
    </main>
  );
}
