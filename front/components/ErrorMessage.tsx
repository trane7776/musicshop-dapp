import React from 'react';

interface Props {
  message: string;
  dismiss: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export const ErrorMessage: React.FC<Props> = ({
  message,
  dismiss,
  className,
}) => {
  return (
    <div className={className}>
      <p>{message}</p>
      <button type="button" onClick={dismiss}>
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
};
