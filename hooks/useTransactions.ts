"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Transaction {
  id: string;
  userId?: string;
  type: 'DATA_PURCHASE' | 'AIRTIME_PURCHASE' | 'CABLE_SUBSCRIPTION' | 'ELECTRICITY_PAYMENT' | 'EXAMPIN_PURCHASE' | 'DEPOSIT' | 'WALLET_FUNDING' | 'REWARD_CREDIT';
  method?: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'COMPLETED';
  reference: string;
  externalReference?: string;
  description?: string;
  phone?: string;
  guestPhone?: string;
  planId?: string;
  apiUsed?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionsResponse {
  data: Transaction[];
  total: number;
}

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data } = await axios.get("/api/transactions");
      return data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
