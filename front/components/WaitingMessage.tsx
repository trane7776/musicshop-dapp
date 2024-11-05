import React from 'react';

interface Props {
  className?: string;
  txHash: string;
}

export const WaitingMessage: React.FC<Props> = ({ className, txHash }) => {
  return (
    <div className={className}>
      Waiting for transaction{' '}
      <b>{txHash.slice(0, 6) + '...' + txHash.slice(-4)}</b>
    </div>
  );
};
