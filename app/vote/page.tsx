import React, { Suspense } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Slash } from "lucide-react";
import { ProposalList } from "@/components/proposal-list/ProposalList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProposalListSkeleton } from "@/components/proposal-list/ProposalListSkeleton";
// import Vote from "@/components/Voting/Index";

export default function VotePage() {
  return (
    <div className="min-h-screen px-2 sm:px-6 py-6">
      <div className="my-5 p-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <span role="img" aria-label="home">
                  🏠
                </span>{" "}
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <Slash />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink>
                <BreadcrumbPage>Vote</BreadcrumbPage>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div>
        <h1 className="text-lg sm:text-xl font-bold">Voting</h1>
      </div>
      <div className="mt-5">
        <p className="text-base sm:text-lg">
          Have your say in the future of the Creative ecosystem.
        </p>
      </div>
      <div className="p-4">
        <div className="grid gap-4 w-full max-w-full">
          <Suspense fallback={<ProposalListSkeleton />}>
            <ProposalList space="vote.thecreative.eth" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
