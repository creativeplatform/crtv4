"use client";

import React from "react";
import SendTransaction from "@/components/SendTransaction";

export default function SendPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Send Transactions</h1>
      <SendTransaction />
    </div>
  );
}
