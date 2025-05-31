import { useState } from "react";
import { useWertWidget } from "@wert-io/module-react-component";
import type {
  GeneralOptions,
  ReactiveOptions,
} from "@wert-io/module-react-component";
import {
  useSigner,
  useBundlerClient,
  useSmartAccountClient,
  useUser,
} from "@account-kit/react";
import { AlchemyWebSigner } from "@account-kit/signer";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";

/*
  In this example we initialize a simple crypto purchase.
  If you are looking for the full documentation or the smart contract example,
  please refer to https://www.npmjs.com/package/@wert-io/module-react-component
*/

function FundButton() {
  const signer: AlchemyWebSigner | null = useSigner();
  const bundlerClient = useBundlerClient();
  const user = useUser();
  const { address } = useSmartAccountClient({});
  const [reactiveOptions] = useState<ReactiveOptions>({
    theme: "dark",
    listeners: {
      loaded: () => console.log("loaded"),
    },
  });
  const { open: openWertWidget, isWidgetOpen } = useWertWidget(reactiveOptions);

  return (
    <Button
      onClick={async () => {
        if (!signer || !address) return;
        const chainId = 8453;
        const nonce = await bundlerClient.getTransactionCount({ address });

        const signed = await signer.signAuthorization({
          address,
          chainId,
          nonce,
        });

        // Concatenate r, s, v to form the signature string
        // v is a bigint, so convert to hex and pad if needed
        const vHex = Number(signed.v).toString(16).padStart(2, "0");
        const signature = `${signed.r}${signed.s}${vHex}`;

        const options: GeneralOptions = {
          partner_id: "01HSD48HCYJH2SNT65S5A0JYPP",
          address,
          network: "base",
          commodity: "usdc",
          commodities: JSON.stringify([
            {
              commodity: "USDC",
              network: "base",
            },
            {
              commodity: "ETH",
              network: "base",
            },
          ]),
          click_id: uuidv4(),
          email: user?.email,
          origin: "https://widget.wert.io",
          signature,
        };
        openWertWidget({ options });
        console.log(isWidgetOpen);
      }}
    >
      Deposit Funds
    </Button>
  );
}

export default FundButton;
