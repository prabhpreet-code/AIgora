'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DEBATE_FACTORY_ADDRESS, DEBATE_FACTORY_ABI, MARKET_FACTORY_ADDRESS, MARKET_FACTORY_ABI } from '@/config/contracts';
import { useAccount, useReadContract, useReadContracts, useWriteContract } from 'wagmi';
import { formatEther, formatAddress } from '@/lib/utils';

type DebateDetails = [
  string,      // topic
  bigint,      // startTime
  bigint,      // duration
  bigint,      // debateEndTime
  bigint,      // currentRound
  bigint,      // totalRounds
  boolean,     // isActive
  string,      // creator
  string,      // market
  string[],    // judges
  boolean,     // hasOutcome
  bigint       // finalOutcome
];

type MarketDetails = [
  string,      // token
  bigint,      // debateId
  boolean,     // resolved
  bigint,      // winningOutcome
  [            // bondingCurve
    bigint,    // target
    bigint,    // current
    bigint,    // basePrice
    bigint,    // currentPrice
    boolean,   // isFulfilled
    bigint     // endTime
  ],
  bigint       // totalBondingAmount
];

type Outcome = {
  name: string;
  index: bigint;
  isValid: boolean;
};

interface DebateViewProps {
  debateId: number;
}

export function DebateView({ debateId }: DebateViewProps) {
  const { isConnected } = useAccount();
  // Get debate details
  const { data: debateDetails } = useReadContract({
    address: DEBATE_FACTORY_ADDRESS,
    abi: DEBATE_FACTORY_ABI,
    functionName: 'getDebateDetails',
    args: [BigInt(debateId)],
  }) as { data: DebateDetails | undefined };

  // placeLimitOrder
  const { writeContract: placeLimitOrder } = useWriteContract({
    address: MARKET_FACTORY_ADDRESS,
    abi: MARKET_FACTORY_ABI,
    functionName: 'placeLimitOrder',
  });

  // Get market details
  const { data: marketId } = useReadContract({
    address: MARKET_FACTORY_ADDRESS,
    abi: MARKET_FACTORY_ABI,
    functionName: 'debateIdToMarketId',
    args: [BigInt(debateId)],
  });

  const { data: marketDetails } = useReadContract({
    address: MARKET_FACTORY_ADDRESS,
    abi: MARKET_FACTORY_ABI,
    functionName: 'getMarketDetails',
    args: marketId ? [marketId] : undefined,
  }) as { data: MarketDetails | undefined };

  // Get outcomes
  const { data: outcomes } = useReadContract({
    address: MARKET_FACTORY_ADDRESS,
    abi: MARKET_FACTORY_ABI,
    functionName: 'getOutcomes',
    args: marketId ? [marketId] : undefined,
  }) as { data: Outcome[] | undefined };

  // Get current prices for each outcome
  const { data: currentPrices } = useReadContracts({
    contracts: outcomes?.map((_, index) => ({
      address: MARKET_FACTORY_ADDRESS,
      abi: MARKET_FACTORY_ABI,
      functionName: 'getCurrentPrice',
      args: [marketId, BigInt(index)],
    })) || [],
  });

  if (!debateDetails || !marketDetails || !outcomes || !currentPrices) return <div>Loading market details...</div>;

  const [
    topic,
    startTime,
    duration,
    debateEndTime,
    currentRound,
    totalRounds,
    isActive,
    creator,
    market,
    judges,
    hasOutcome,
    finalOutcome
  ] = debateDetails;

  const [
    token,
    _debateId,
    resolved,
    winningOutcome,
    bondingCurve,
    totalBondingAmount
  ] = marketDetails;

  const endDate = new Date(Number(debateEndTime) * 1000);
  const timeRemaining = Math.max(0, Number(debateEndTime) - Math.floor(Date.now() / 1000));
  const daysRemaining = Math.floor(timeRemaining / (24 * 60 * 60));
  const hoursRemaining = Math.floor((timeRemaining % (24 * 60 * 60)) / 3600);

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Debate Information */}
      <Card className="bg-[#1C2128] border-0">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold mb-2">{topic}</h2>
                <div className="text-sm text-gray-400">Created by {formatAddress(creator)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {isActive ? (
                    <span className="text-green-400">Active</span>
                  ) : (
                    <span className="text-red-400">Ended</span>
                  )}
                </div>
                {isActive && (
                  <div className="text-sm text-gray-400">
                    {daysRemaining}d {hoursRemaining}h remaining
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-800">
              <div>
                <div className="text-sm text-gray-400">Total Volume</div>
                <div className="font-medium">${formatEther(totalBondingAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Round</div>
                <div className="font-medium">{currentRound.toString()}/{totalRounds.toString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">End Date</div>
                <div className="font-medium">{endDate.toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Judges</div>
                <div className="font-medium">{judges.length}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outcomes List */}
      <Card className="bg-[#1C2128] border-0">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-400">OUTCOME</div>
            <div className="text-sm text-gray-400">% CHANCE ↻</div>
          </div>
          <div className="space-y-4">
            {outcomes.map((outcome, i) => {
              const currentPrice = Number(currentPrices[i] || 0n) / 100; // Convert basis points to percentage
              const volume = formatEther(marketDetails[5]);
              return (
                <div key={i} className="border-t border-gray-800 pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{outcome.name}</div>
                      <div className="text-sm text-gray-400">${volume} Vol.</div>
                    </div>
                    <div className="text-xl font-medium">{currentPrice}%</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 bg-[#1F3229] text-[#3FB950] border-[#238636] hover:bg-[#238636] hover:text-white"
                    >
                      Buy Yes {(currentPrice/100).toFixed(1)}¢
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 bg-[#3B2325] text-[#F85149] border-[#F85149] hover:bg-[#F85149] hover:text-white"
                    >
                      Buy No {((100-currentPrice)/100).toFixed(1)}¢
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 