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

const AIRTIME_NETWORKS = [
  { id: "1", name: "MTN" },
  { id: "2", name: "Airtel" },
  { id: "3", name: "Glo" },
  { id: "4", name: "9Mobile" },
];

const AIRTIME_AMOUNTS = [
  { amount: 100, label: "₦100" },
  { amount: 200, label: "₦200" },
  { amount: 500, label: "₦500" },
  { amount: 1000, label: "₦1,000" },
  { amount: 2000, label: "₦2,000" },
  { amount: 5000, label: "₦5,000" },
];

export function BuyAirtimeComponent() {
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<number | "">("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    const amount = customAmount ? parseInt(customAmount) : selectedAmount;

    if (!selectedNetwork || !amount || !phoneNumber) {
      toast.error("Please fill all fields");
      return;
    }

    if (amount < 50 || amount > 50000) {
      toast.error("Amount must be between ₦50 and ₦50,000");
      return;
    }

    console.log("[BuyAirtime] Selected network:", selectedNetwork);
    console.log("[BuyAirtime] Selected amount:", amount);

    setLoading(true);

    try {
      const requestBody = {
        networkId: selectedNetwork,
        amount,
        phoneNumber,
      };
      console.log("[BuyAirtime] Sending purchase request:", requestBody);

      const response = await fetch("/api/airtime/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("[BuyAirtime] Purchase response:", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || "Purchase failed");
      }

      toast.success("Airtime purchase initiated!");
      // Reset form
      setSelectedNetwork("");
      setSelectedAmount("");
      setCustomAmount("");
      setPhoneNumber("");
    } catch (error) {
      console.error("[BuyAirtime] Purchase error:", error);
      toast.error(error instanceof Error ? error.message : "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Buy Airtime</CardTitle>
        <CardDescription>
          Purchase airtime for any Nigerian network
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
              {AIRTIME_NETWORKS.map((network) => (
                <SelectItem key={network.id} value={network.id}>
                  {network.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

        {/* Amount Selection */}
        <div className="space-y-2">
          <Label>Amount</Label>
          <div className="grid grid-cols-3 gap-2">
            {AIRTIME_AMOUNTS.map((item) => (
              <Button
                key={item.amount}
                variant={selectedAmount === item.amount ? "default" : "outline"}
                onClick={() => {
                  setSelectedAmount(item.amount);
                  setCustomAmount("");
                }}
                className="text-sm"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="space-y-2">
          <Label htmlFor="custom">Custom Amount (₦)</Label>
          <Input
            id="custom"
            type="number"
            placeholder="Enter custom amount"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount("");
            }}
            min="50"
            max="50000"
          />
        </div>

        {/* Purchase Button */}
        <Button
          onClick={handlePurchase}
          disabled={loading || (!selectedAmount && !customAmount)}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Buy Airtime"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
