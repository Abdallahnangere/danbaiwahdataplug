"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  status: 'IN_PROGRESS' | 'EARNED' | 'CLAIMED';
  claimedAt?: Date;
  createdAt: Date;
}

interface RewardsResponse {
  availableRewards: any[];
  userRewards: UserReward[];
}

export function useRewards() {
  return useQuery<RewardsResponse>({
    queryKey: ["rewards"],
    queryFn: async () => {
      const { data } = await axios.get("/api/rewards");
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
