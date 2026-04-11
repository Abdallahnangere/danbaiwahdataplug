"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
  tier: string;
  balance: number;
  isBanned: boolean;
  isActive: boolean;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function useUser() {
  return useQuery<User>({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await axios.get("/api/auth/me");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
