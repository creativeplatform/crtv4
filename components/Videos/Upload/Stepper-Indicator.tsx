import { Separator } from "@/components/ui/separator";
import clsx from "clsx";
import { Check } from "lucide-react";
import React, { Fragment } from "react";

interface StepperIndicatorProps {
  activeStep: number;
}

const StepperIndicator = ({ activeStep }: StepperIndicatorProps) => {
  return (
    <div className="flex items-center justify-center">
      {[1, 2, 3, 4].map((step) => (
        <Fragment key={step}>
          <div
            className={clsx(
              "m-[5px] flex h-[40px] w-[40px] items-center justify-center rounded-full border-[2px]",
              step < activeStep && "bg-secondary text-[#EC407A]",
              step === activeStep && "border-primary text-primary"
            )}
          >
            {step >= activeStep ? step : <Check className="h-5 w-5" />}
          </div>
          {step !== 4 && (
            <Separator
              orientation="horizontal"
              className={clsx(
                "h-[2px] w-[100px]",
                step <= activeStep - 1 && "bg-primary"
              )}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
};

export default StepperIndicator;
