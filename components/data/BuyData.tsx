"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export function BuyDataComponent() {
  const [networks, setNetworks] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fetch networks on mount
  useEffect(() => {
    fetchNetworks();
  }, []);

  // Fetch plans when network changes
  useEffect(() => {
    if (selectedNetwork) {
      fetchPlans(selectedNetwork);
    } else {
      setPlans([]);
    }
  }, [selectedNetwork]);

  const fetchNetworks = async () => {
    try {
      console.log(\"[BuyData] Fetching networks...\");
      const response = await fetch(\"/api/data/networks\");
      const data = await response.json();
      console.log(\"[BuyData] Networks response:\", data);
      setNetworks(data.networks || []);
    } catch (error) {
      console.error(\"[BuyData] Failed to fetch networks:\", error);
      toast.error(\"Failed to fetch networks\");
    }
  };

  const fetchPlans = async (networkId: string) => {
    try {
      console.log(\"[BuyData] Fetching plans for network:\", networkId);
      const response = await fetch(`/api/data/plans/${networkId}`);
      const data = await response.json();
      console.log(\"[BuyData] Plans response:\", data);
      setPlans(data.plans || []);
    } catch (error) {
      console.error(\"[BuyData] Failed to fetch plans:\", error);
      toast.error(\"Failed to fetch plans\");
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !phoneNumber) {
      Toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        planId: selectedPlan,
        phoneNumber,
      };
      console.log("[BuyData] Sending purchase request:", requestBody);

      const response = await fetch("/api/data/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("[BuyData] Purchase response:", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || "Purchase failed");
      }

      toast.success("Data purchase initiated!");
      // Reset form
      setSelectedNetwork("");
      setSelectedPlan("");
      setPhoneNumber("");
    } catch (error) {
      console.error("[BuyData] Purchase error:", error);
      toast.error(
        error instanceof Error ? error.message : "Purchase failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Buy Data</CardTitle>
        <CardDescription>
          Purchase data plan for any Nigerian network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Selection */}
        <div className="space-y-2">
          <Label htmlFor="network">Network</Label>
          <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
            <SelectTrigger>
              <SelectValue placeholder="Select a network" />
            </SelectTrigger>
            <SelectContent>
              {networks.map((network) => (
                <SelectItem key={network.id} value={network.id}>
                  {network.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Plan Selection */}
        {plans.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="plan">Data Plan</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.volume} - ₦{plan.price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            placeholder="09012345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        {/* Purchase Button */}
        <Button
          onClick={handlePurchase}
          disabled={loading || !selectedPlan}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Buy Data"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
