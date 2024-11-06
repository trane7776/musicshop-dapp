'use client';
import { MusicShop } from '@/typechain';
import { BrowserProvider, ethers } from 'ethers';
import React, { useEffect } from 'react';

interface CurrentConnectionProps {
  provider?: BrowserProvider;
  shop?: MusicShop;
  signer?: ethers.JsonRpcSigner;
}

export interface AlbumProps {
  index: ethers.BigNumberish;
  uid: string;
  title: string;
  price: ethers.BigNumberish;
  quantity: ethers.BigNumberish;
}
export const useEtherState = () => {
  const [networkError, setNetworkError] = React.useState<string>();
  const [txBeingSent, setTxBeingSent] = React.useState<string>();

  const [transactionError, setTransactionError] = React.useState<any>();
  const [currentBalance, setCurrentBalance] = React.useState<string>();
  const [isOwner, setIsOwner] = React.useState<boolean>(false);

  const [albums, setAlbums] = React.useState<AlbumProps[]>([]);
  const [title, setTitle] = React.useState<string>('');
  const [price, setPrice] = React.useState<string>('');
  const [quantity, setQuantity] = React.useState<string>('');

  const [currentConnection, setCurrentConnection] =
    React.useState<CurrentConnectionProps>();

  useEffect(() => {
    (async () => {
      if (currentConnection?.shop && currentConnection?.signer) {
        const allAlbums = (await currentConnection.shop.allAlbums()).map(
          (album): AlbumProps => {
            return {
              index: album.index.toString(),
              uid: album.uid,
              title: album.title,
              price: album.price,
              quantity: album.quantity,
            };
          }
        );

        setAlbums(allAlbums);

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

  return {
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
  };
};
