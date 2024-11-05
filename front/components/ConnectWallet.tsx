import React from 'react';
import { ErrorMessage } from './ErrorMessage';

interface Props {
  connectWallet: React.MouseEventHandler<HTMLButtonElement>;
  dismiss: React.MouseEventHandler<HTMLButtonElement>;
  networkError?: string;
  className?: string;
}

export const ConnectWallet: React.FC<Props> = ({
  connectWallet,
  dismiss,
  networkError,
  className,
}) => {
  return (
    <div className={className}>
      <div>
        {networkError && (
          <ErrorMessage message={networkError} dismiss={dismiss} />
        )}
      </div>
      <p>Please connect your account...</p>
      <button
        type="button"
        className="flex justify-center px-4 py-2 text-sm font-medium text-black bg-primary border rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
        onClick={connectWallet}
      >
        Connect Wallet
      </button>
    </div>
  );
};
