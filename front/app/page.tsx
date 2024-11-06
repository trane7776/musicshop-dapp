'use client';

import React, { FormEvent, useEffect } from 'react';

import { ethers } from 'ethers';
import { MusicShop__factory } from '@/typechain';

import { ConnectWallet } from '@/components/ConnectWallet';
import { WaitingMessage } from '@/components/WaitingMessage';
import { ErrorMessage } from '@/components/ErrorMessage';
import { AlbumProps, useEtherState } from '@/hooks/useEtherState';
const HARDHAT_NETWORK_ID = '0x7a69'; // 31337
const MUSIC_SHOP_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
declare let window: any;
export default function Home() {
  const {
    networkError,
    setNetworkError,
    txBeingSent,
    setTxBeingSent,
    transactionError,
    setTransactionError,
    currentBalance,
    setCurrentBalance,
    isOwner,
    setIsOwner,
    albums,
    setAlbums,
    title,
    setTitle,
    price,
    setPrice,
    quantity,
    setQuantity,
    currentConnection,
    setCurrentConnection,
  } = useEtherState();
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
    setAlbums([]);

    setCurrentConnection({
      provider: undefined,
      shop: undefined,
      signer: undefined,
    });
    setNetworkError(undefined);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setNetworkError('Please install MetaMask');
      return false;
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

  const handleAlbumSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentConnection?.shop) {
      return;
    }
    const shop = currentConnection?.shop;
    if (!title || !price || !quantity) {
      setTransactionError('Please fill all fields');
      return;
    }
    const uid = ethers.solidityPackedKeccak256(['string'], [title]);
    try {
      const index = await shop.currentIndex();
      const addTransaction = await shop.addAlbum(
        uid,
        title,
        ethers.parseEther(price),
        BigInt(quantity)
      );
      setTxBeingSent(addTransaction.hash);
      await addTransaction.wait();
      setAlbums([
        ...albums,
        {
          index: index,
          uid,
          title,
          price: ethers.parseEther(price),
          quantity: BigInt(quantity),
        },
      ]);
    } catch (error) {
      setTransactionError(error);
      console.error(error);
    } finally {
      setTxBeingSent(undefined);
    }
  };

  const handleBuyAlbum = async (album: AlbumProps) => {
    if (!currentConnection?.shop) {
      return;
    }
    const shop = currentConnection?.shop;
    try {
      const buyTx = await shop.buy(album.index, { value: album.price });
      setTxBeingSent(buyTx.hash);
      await buyTx.wait();

      setAlbums(
        albums.map((a) => {
          if (a.index === album.index) {
            album.quantity = BigInt(album.quantity) - BigInt(1);
            return album;
          } else {
            return a;
          }
        })
      );
    } catch (error) {
      setTransactionError(error);
      console.error(error);
    } finally {
      setTxBeingSent(undefined);
    }
  };

  return (
    <main className="mx-auto max-w-[1280px] my-20">
      <h1 className="text-3xl font-bold">Music Shop</h1>
      {!currentConnection?.signer && (
        <ConnectWallet
          connectWallet={connectWallet}
          dismiss={dismissNetworkError}
          networkError={networkError}
        />
      )}
      {currentConnection?.signer && (
        <p>
          Your address:{' '}
          {currentConnection.signer?.address.slice(0, 6) +
            '...' +
            currentConnection.signer?.address.slice(-4)}
        </p>
      )}

      {txBeingSent && <WaitingMessage txHash={txBeingSent} />}

      {transactionError && (
        <ErrorMessage
          message={getRpcErrorMessage(transactionError)}
          dismiss={dismissTransactionError}
        />
      )}
      {currentBalance && (
        <p>
          Your balance: {ethers.formatEther(currentBalance).slice(0, 10)} ETH
        </p>
      )}

      {albums.length > 0 && (
        <ul className="flex flex-row gap-5 my-5">
          {albums.map((album) => (
            <li key={album.index} className="flex flex-col mb-2">
              <p>ID: {album.index}</p>

              <h2>Title: {album.title}</h2>
              <p>UID: {album.uid.slice(0, 6) + '...' + album.uid.slice(-4)}</p>

              <p>Price: {ethers.formatEther(album.price)} ETH</p>
              <p>Quantity: {album.quantity}</p>

              {BigInt(album.quantity) > BigInt(0) && (
                <button
                  type="button"
                  className="w-72 my-5 flex justify-center px-4 py-2 text-sm font-medium text-black bg-primary border rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
                  onClick={() => handleBuyAlbum(album)}
                >
                  Buy this album
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOwner && !txBeingSent && (
        <form onSubmit={handleAlbumSubmit} className="flex flex-col gap-2">
          <h2 className="font-bold">Add Album</h2>
          <label className="flex gap-2">
            Title
            <input
              className=" border border-gray-300  px-2 py-1 "
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="flex gap-2">
            Price
            <input
              className="border border-gray-300  px-2 py-1 "
              type="text"
              name="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <label className="flex gap-2">
            Quantity
            <input
              className="border border-gray-300  px-2 py-1 "
              type="text"
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <input
            type="submit"
            className="w-72 my-5 flex justify-center px-4 py-2 text-sm font-medium text-black bg-primary border rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
            value={`Add`}
          />
        </form>
      )}
    </main>
  );
}
