'use client';

import { useMetaMask } from './use-metamask';

export default function ConnectWallet() {
  const { account, connectWallet } = useMetaMask();

  return (
    <button
      onClick={connectWallet}
      className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
    >
      {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Connect Wallet'}
    </button>
  );
}