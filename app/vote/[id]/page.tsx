import { Suspense } from "react";
import { notFound } from "next/navigation";
import { gql } from "@apollo/client";
import { makeServerClient } from "@/lib/apollo-server-client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Proposal } from "@/components/proposal-list/ProposalList";
import { VotingForm } from "@/components/proposal-list/ProposalList";
import ClaimPoap from "@/components/vote/ClaimPoap";
import { shortenAddress } from "@/lib/utils/utils";

const GET_PROPOSAL = gql`
  query Proposal($id: String!) {
    proposal(id: $id) {
      id
      title
      body
      choices
      start
      end
      snapshot
      state
      author
      scores
      scores_total
      votes
    }
  }
`;

interface ProposalDetailsPageProps {
  params: { id: string };
}

export default async function ProposalDetailsPage({
  params,
}: ProposalDetailsPageProps) {
  const client = makeServerClient();
  const { data } = await client.query<{
    proposal: Proposal & { author: string };
  }>({
    query: GET_PROPOSAL,
    variables: { id: params.id },
    fetchPolicy: "no-cache",
  });

  if (!data?.proposal) return notFound();
  const proposal = data.proposal;

  const now = Math.floor(Date.now() / 1000);
  const isVotingActive = now >= proposal.start && now <= proposal.end;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-6 flex flex-col items-center">
          <div className="w-full max-w-3xl">
            <Card className="p-6 mb-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2 mt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-4 w-1/2 mt-4" />
              </div>
            </Card>
            <Card className="p-6 mb-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="h-32 w-full" />
            </Card>
            <Card className="p-6 mb-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      }
    >
      <div className="min-h-screen p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <Card className="p-6 mb-6 overflow-x-auto">
            <h1 className="text-2xl font-bold mb-2 break-words">
              {proposal.title}
            </h1>
            <div className="mb-4 text-gray-500 space-y-1 break-all">
              <div className="truncate max-w-full">
                By: {shortenAddress(proposal.author)}
              </div>
              <div>
                Start: {new Date(proposal.start * 1000).toLocaleString()}
              </div>
              <div>End: {new Date(proposal.end * 1000).toLocaleString()}</div>
              <div>State: {proposal.state}</div>
            </div>
            <div className="mb-6 whitespace-pre-line break-words">
              {proposal.body}
            </div>
            <div className="mb-6">
              <span className="font-semibold">Snapshot:</span>{" "}
              {proposal.snapshot}
            </div>
          </Card>
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-bold mb-2">Voting</h2>
            {isVotingActive ? (
              typeof VotingForm === "function" ? (
                <VotingForm proposal={proposal} />
              ) : (
                <div className="text-gray-400">Voting form placeholder</div>
              )
            ) : (
              <div className="text-gray-400">Voting is not active.</div>
            )}
          </Card>
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-bold mb-2">Current Results</h2>
            {proposal.scores && proposal.choices ? (
              <ul className="mb-2">
                {proposal.choices.map((choice: string, idx: number) => {
                  const votes = proposal.scores?.[idx] ?? 0;
                  const total = proposal.scores_total ?? 0;
                  const percent =
                    total > 0 ? Math.round((votes / total) * 100) : 0;
                  return (
                    <li key={choice} className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span>{choice}</span>
                        <span className="font-semibold">{votes}</span>
                      </div>
                      <div
                        className="w-full bg-gray-200 rounded h-3"
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Votes for ${choice}`}
                      >
                        <div
                          className="bg-blue-500 h-3 rounded"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {percent}%
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-gray-400">No results available</div>
            )}
            <div className="mt-2 text-sm text-gray-500">
              Total votes: {proposal.scores_total ?? 0}
            </div>
          </Card>
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-bold mb-2">Claim POAP</h2>
            {/* TODO: POAP claim component goes here */}
            <div className="text-gray-400">
              <ClaimPoap
                address={proposal.author}
                proposalId={proposal.id}
                snapshot={proposal.snapshot}
              />
            </div>
          </Card>
        </div>
      </div>
    </Suspense>
  );
}
