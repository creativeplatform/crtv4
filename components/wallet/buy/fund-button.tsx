import React from "react";
import { Button } from "@/components/ui/button";
import { useWertWidget } from "@wert-io/module-react-component";
import type {
  GeneralOptions,
  ReactiveOptions,
} from "@wert-io/module-react-component";

/*
  In this example we initialize a simple crypto purchase.
  If you are looking for the full documentation or the smart contract example,
  please refer to https://www.npmjs.com/package/@wert-io/module-react-component
*/

interface WertButtonProps {
  onClose?: () => void;
}

const WertButton: React.FC<WertButtonProps> = ({ onClose }) => {
  // Here goes the list of all static options. This object is then passed to the open() method
  const options: GeneralOptions = {
    partner_id: "01FGKYK638SV618KZHAVEY7P79",
    origin: "https://sandbox.wert.io", // this option needed only in sandbox
    commodity: "ETH",
    network: "base_sepolia",
  };
  // The reactive options - listeners and theme-related parameters - are passed to the useWertWidget() hook
  const [reactiveOptions] = React.useState<ReactiveOptions>({
    listeners: {
      loaded: () => {
        console.log("loaded");
        onClose?.();
      },
    },
  });

  const { open } = useWertWidget(reactiveOptions);

  return (
    <Button
      onClick={() => {
        // Remove existing Wert iframe if present to prevent duplicate errors
        const existingIframe = document.getElementById("turnkey-iframe");
        if (existingIframe) existingIframe.remove();
        open({ options });
      }}
    >
      Deposit Funds
    </Button>
  );
};

export default WertButton;
