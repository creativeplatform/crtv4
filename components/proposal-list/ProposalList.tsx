"use client";

import { useSuspenseQuery, gql } from "@apollo/client";
import { Card } from "@/components/ui/card";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function ProposalList({ space }: ProposalListProps) {
  const { data, error } = useSuspenseQuery<{ proposals: Proposal[] }>(
    GET_PROPOSALS,
    {
      variables: { space, first: 10 },
    }
  );

  if (error)
    return (
      <div className="p-4 text-red-500">
        Failed to load proposals: {error.message}
      </div>
    );
  if (!data?.proposals?.length)
    return <div className="p-4">No proposals found.</div>;

  return (
    <div className="grid gap-4 w-full overflow-x-auto">
      {data.proposals.map((proposal) => (
        <Link key={proposal.id} href={`/vote/${proposal.id}`} className="block">
          <Card className="p-2 sm:p-4 w-full cursor-pointer hover:shadow-lg transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-1 truncate">
              {proposal.title}
            </h2>
            <p className="hidden sm:block text-sm sm:text-base text-gray-500 mb-2">
              {proposal.body.slice(0, 120)}
              {proposal.body.length > 120 ? "..." : ""}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-400 gap-1 sm:gap-2">
              <span>
                Start: {new Date(proposal.start * 1000).toLocaleString()}
              </span>
              <span className="hidden sm:inline">|</span>
              <span>End: {new Date(proposal.end * 1000).toLocaleString()}</span>
              <span className="hidden sm:inline">|</span>
              <span>State: {proposal.state}</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export { ProposalList, VotingForm };
export default ProposalList;

const GET_PROPOSALS = gql`
  query Proposals($space: String!, $first: Int!) {
    proposals(
      first: $first
      skip: 0
      where: { space_in: [$space] }
      orderBy: "created"
      orderDirection: desc
    ) {
      id
      title
      body
      choices
      start
      end
      snapshot
      state
    }
  }
`;

interface ProposalListProps {
  space: string;
}

export interface Proposal {
  id: string;
  title: string;
  body: string;
  choices: string[];
  start: number;
  end: number;
  snapshot: string;
  state: string;
  scores?: number[];
  scores_total?: number;
  votes?: number;
}

function VotingForm({ proposal }: { proposal: Proposal }) {
  const schema = z.object({
    choice: z.string().min(1, "Please select a choice"),
  });
  const methods = useForm<{ choice: string }>({
    resolver: zodResolver(schema),
    defaultValues: { choice: "" },
  });
  const { handleSubmit, reset } = methods;

  function onSubmit(values: { choice: string }) {
    // TODO: Integrate with backend/blockchain
    // For now, just log
    console.log({ proposalId: proposal.id, choice: values.choice });
    reset();
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField
          name="choice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vote</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col gap-2"
                >
                  {proposal.choices.map((choice, idx) => (
                    <RadioGroupItem
                      key={choice}
                      value={choice}
                      id={`choice-${proposal.id}-${idx}`}
                    >
                      <span className="ml-2">{choice}</span>
                    </RadioGroupItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="mt-2 w-full">
          Submit Vote
        </Button>
      </form>
    </FormProvider>
  );
}
