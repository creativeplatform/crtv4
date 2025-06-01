import { Button } from "@/components/ui/button";
import { getOnrampBuyUrl } from "@coinbase/onchainkit/fund";
import { useSmartAccountClient } from "@account-kit/react";
import { useState } from "react";

function CdpFundButton() {
  const { address } = useSmartAccountClient({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleFund() {
    if (!address) return;

    setIsLoading(true);
    // Fetch session token from your backend
    const res = await fetch("/api/coinbase/session-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, assets: ["USDC"] }),
    });
    const { sessionToken } = await res.json();
    setIsLoading(false);

    if (!sessionToken) {
      alert("Failed to get session token");
      return;
    }

    // Generate the Onramp URL with the sessionToken
    const onrampBuyUrl = getOnrampBuyUrl({
      sessionToken,
      presetFiatAmount: 30,
      fiatCurrency: "USD",
      redirectUrl: "https://tv.creativeplatform.xyz",
    });

    window.open(onrampBuyUrl, "_blank");
  }

  return (
    <Button onClick={handleFund} disabled={isLoading}>
      {isLoading ? "Loading..." : "Fund"}
    </Button>
  );
}

export default CdpFundButton;
