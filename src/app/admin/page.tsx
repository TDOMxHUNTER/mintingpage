'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContracts, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { isAddress, formatEther } from 'viem';

import { Button } from '@/components/ui/button';
import { contractABI } from '@/lib/abi';

type WriteableFunctionNames =
  | "setGtdActive"
  | "setFcfsActive"
  | "setPublicActive"
  | "setGTDAllowlist"
  | "setFCFSAllowlist"
  | "setBaseURI"
  | "withdraw"
  | "permanentlyStopMinting";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

const AdminPage = () => {
  const { address, isConnected } = useAccount();
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();

  const [isOwner, setIsOwner] = useState(false);
  const [status, setStatus] = useState('Connecting...');

  // Form states
  const [baseURIInput, setBaseURIInput] = useState('');

  const { data: ownerAddress } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'owner',
    query: { enabled: isConnected },
  });

  const { data: contractData, refetch: refetchContractData } = useReadContracts({
    contracts: [
      { address: contractAddress, abi: contractABI, functionName: 'gtdActive' },
      { address: contractAddress, abi: contractABI, functionName: 'fcfsActive' },
      { address: contractAddress, abi: contractABI, functionName: 'publicActive' },
      { address: contractAddress, abi: contractABI, functionName: 'GTD_PRICE' },
      { address: contractAddress, abi: contractABI, functionName: 'FCFS_PRICE' },
      { address: contractAddress, abi: contractABI, functionName: 'PUBLIC_PRICE' },
    ],
    query: { enabled: isConnected && !!address && !!contractAddress }
  });

  const [gtdActive, setGtdActive] = useState(false);
  const [fcfsActive, setFcfsActive] = useState(false);
  const [publicActive, setPublicActive] = useState(false);
  const [currentGtdPrice, setCurrentGtdPrice] = useState('0');
  const [currentFcfsPrice, setCurrentFcfsPrice] = useState('0');
  const [currentPublicPrice, setCurrentPublicPrice] = useState('0');

  useEffect(() => {
    if (contractData) {
      setGtdActive(!!contractData[0]?.result);
      setFcfsActive(!!contractData[1]?.result);
      setPublicActive(!!contractData[2]?.result);

      setCurrentGtdPrice(
        typeof contractData[3]?.result === 'bigint'
          ? formatEther(contractData[3].result as bigint)
          : '0'
      );
      setCurrentFcfsPrice(
        typeof contractData[4]?.result === 'bigint'
          ? formatEther(contractData[4].result as bigint)
          : '0'
      );
      setCurrentPublicPrice(
        typeof contractData[5]?.result === 'bigint'
          ? formatEther(contractData[5].result as bigint)
          : '0'
      );
    }
  }, [contractData]);

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConnected && address && ownerAddress) {
      if (address.toLowerCase() === (ownerAddress as string).toLowerCase()) {
        setIsOwner(true);
        setStatus('Welcome, Owner. All systems operational.');
      } else {
        setIsOwner(false);
        setStatus('Access Denied: You are not the contract owner.');
      }
    } else if (!isConnected) {
      setIsOwner(false);
      setStatus('Please connect your wallet to access the dashboard.');
    }
  }, [address, isConnected, ownerAddress]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isPending) setStatus('Please confirm in your wallet...');
    else if (isConfirming) setStatus('Waiting for transaction confirmation...');
    else if (isConfirmed) {
      setStatus('Transaction successful!');
      refetchContractData();
      timeoutId = setTimeout(() => setStatus('Welcome, Owner. All systems operational.'), 5000);
    }
    else if (writeError) {
      setStatus(`Error: ${writeError.message}`);
      timeoutId = setTimeout(() => setStatus('Welcome, Owner. All systems operational.'), 5000);
    }
    return () => clearTimeout(timeoutId);
  }, [isPending, isConfirming, isConfirmed, writeError, refetchContractData]);

  const handleWrite = (functionName: WriteableFunctionNames, args: any, successMessage: string) => {
    if (!isOwner) return;
    setStatus('Preparing transaction...');
    writeContract({
      address: contractAddress!,
      abi: contractABI,
      functionName,
      args,
    }, {
      onSuccess: () => setStatus('Transaction sent. Waiting for confirmation...'),
      onError: (err) => setStatus(`Error: ${err.message}`)
    });
  };

  const handleSyncGtdAllowlist = async () => {
    if (!isOwner || isPending) return;
    setStatus("Fetching wallets for GTD allowlist...");
    try {
        const response = await fetch('/api/sync-wallets');
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        const gtdWallets = data.gtdWallets.filter(isAddress) || [];

        if (gtdWallets.length > 0) {
            handleWrite('setGTDAllowlist', [gtdWallets, true], `Successfully synced ${gtdWallets.length} GTD wallets.`);
        } else {
            setStatus("No valid GTD wallets found from the server.");
        }
    } catch (err: any) {
        console.error(err);
        setStatus(err.message || 'Error syncing GTD allowlist.');
    }
  };

  const handleSyncFcfsAllowlist = async () => {
      if (!isOwner || isPending) return;
      setStatus("Fetching wallets for FCFS allowlist...");
      try {
          const response = await fetch('/api/sync-wallets');
          if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
          const data = await response.json();
          const fcfsWallets = data.fcfsWallets.filter(isAddress) || [];

          if (fcfsWallets.length > 0) {
              handleWrite('setFCFSAllowlist', [fcfsWallets, true], `Successfully synced ${fcfsWallets.length} FCFS wallets.`);
          } else {
              setStatus("No valid FCFS wallets found from the server.");
          }
      } catch (err: any) {
          console.error(err);
          setStatus(err.message || 'Error syncing FCFS allowlist.');
      }
  };

  if (!isOwner) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-12">
        <div className="card text-center">
          <h1 className="text-2xl text-red-500">Access Denied</h1>
          <p className="text-gray-300 mt-2">{status}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 pt-24">
      <div className="card w-full max-w-4xl">
        <h1 className="text-3xl text-white mb-4">Jarl Pass Dashboard</h1>
        <p className="text-gray-400 mb-6 text-sm h-4">{status}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl mb-2">Minting Phase Control</h2>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center justify-between">
                  <span>GTD Active</span>
                  <input type="checkbox" checked={gtdActive} onChange={() => handleWrite('setGtdActive', [!gtdActive], 'GTD phase updated')} />
                </label>
                <label className="flex items-center justify-between">
                  <span>FCFS Active</span>
                  <input type="checkbox" checked={fcfsActive} onChange={() => handleWrite('setFcfsActive', [!fcfsActive], 'FCFS phase updated')} />
                </label>
                <label className="flex items-center justify-between">
                  <span>Public Active</span>
                  <input type="checkbox" checked={publicActive} onChange={() => handleWrite('setPublicActive', [!publicActive], 'Public phase updated')} />
                </label>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl mb-2">Allowlist Management</h2>
              <p className="text-sm text-gray-400 mb-3">Fetches wallets from the submission server and syncs them with the smart contract.</p>
              <div className="flex gap-4">
                <Button onClick={handleSyncGtdAllowlist} disabled={isPending} variant="outline" className="w-full">Sync GTD Allowlist</Button>
                <Button onClick={handleSyncFcfsAllowlist} disabled={isPending} variant="outline" className="w-full">Sync FCFS Allowlist</Button>
              </div>
            </div>

            <div>
              <h2 className="text-xl mb-2">Metadata Base URI</h2>
               <div className="flex gap-2">
                <input type="text" className="form-input" placeholder="ipfs://... or https://..." value={baseURIInput} onChange={e => setBaseURIInput(e.target.value)} />
                <Button onClick={() => handleWrite('setBaseURI', [baseURIInput], 'Base URI updated')} variant="outline">Set</Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl mb-2">Prices</h2>
              <div className="space-y-2">
                <p>GTD Price: {currentGtdPrice} MON</p>
                <p>FCFS Price: {currentFcfsPrice} MON</p>
                <p>Public Price: {currentPublicPrice} MON</p>
              </div>
            </div>

            <div className="border-t border-red-500/30 pt-6">
              <h2 className="text-xl mb-2 text-red-400">Danger Zone</h2>
              <Button onClick={() => handleWrite('withdraw', [], 'Withdraw successful')} variant="outline" className="w-full">Withdraw Funds</Button>
              <Button onClick={() => {
                if (confirm("Are you sure you want to permanently stop all minting? This action cannot be undone.")) {
                  handleWrite('permanentlyStopMinting', [], 'Minting permanently halted');
                }
              }} variant="outline" className="w-full mt-2 text-red-400 border-red-500 hover:bg-red-900/50">Permanently Halt All Minting</Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminPage;
