import { useState, useEffect } from 'react';
import { saveTransaction } from '../services/firebase';

interface Route {
  chain: string;
  fee: number;
  speed: string;
}

export interface BestPath {
  id: string;
  hash: string;
  from: string;
  to: string;
  route: Route[];
  totalFee: number;
  savings: number;
  status: 'confirmed' | 'pending' | 'failed';
  type: 'swap' | 'transfer' | 'stake' | 'bridge';
}

export const useLiquidityAgent = () => {
  const [bestPath, setBestPath] = useState<BestPath | null>(null);
  const [transactions, setTransactions] = useState<BestPath[]>([]);

  useEffect(() => {
    const analyzeData = () => {
      const chains = ['Hedera', 'Solana', 'Ethereum (L2)', 'Polygon'];
      const selectedChains = chains.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      const hex = () => Math.random().toString(16).slice(2, 8).toUpperCase();
      const addr = () => `0x${hex()}...${hex().slice(0, 4)}`;

      const newPath: BestPath = {
        id: crypto.randomUUID(),
        hash: `0x${Math.random().toString(16).slice(2, 10)}...`,
        from: addr(),
        to: addr(),
        route: selectedChains.map(chain => ({
          chain,
          fee: parseFloat((Math.random() * 0.5).toFixed(4)),
          speed: '200ms'
        })),
        totalFee: parseFloat((Math.random() * 1.5).toFixed(2)),
        savings: Math.floor(Math.random() * 40) + 10,
        status: 'confirmed',
        type: 'bridge'
      };

      setBestPath(newPath);
      setTransactions(prev => [newPath, ...prev.slice(0, 5)]);

      saveTransaction({
        txHash: newPath.hash,
        walletAddress: newPath.from,
        amountIn: '1000.00',
        amountOut: (1000 + newPath.savings).toString(),
        tokenIn: 'USDC',
        tokenOut: 'USDC',
        route: newPath.route.map(r => ({
          protocol: 'Nexus Optimized',
          poolAddress: '0xAddress',
          tokenIn: 'USDC',
          tokenOut: 'USDC',
          fee: r.fee * 1000,
        })),
        aiScore: 0.95,
        gasCostUsd: newPath.totalFee,
        slippageTolerance: 0.005,
        status: newPath.status
      }).catch(err => console.error('[useLiquidityAgent] Save failed:', err));
    };

    const interval = setInterval(analyzeData, 5000);
    analyzeData();
    return () => clearInterval(interval);
  }, []);

  return { bestPath, transactions };
};