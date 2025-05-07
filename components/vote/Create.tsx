"use client";

import { useState, Suspense } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAccount, useChain } from "@account-kit/react";
import { useRouter } from "next/navigation";
import { createProposal } from "@/app/vote/create/actions";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const proposalSchema = z.object({
  title: z.string().min(3, "Title is required"),
  content: z.string().min(3, "Content is required"),
  choices: z
    .array(z.object({ value: z.string().min(1, "Choice cannot be empty") }))
    .min(2, "At least two choices required"),
  start: z.string().min(1, "Start date required"),
  startTime: z.string().min(1, "Start time required"),
  end: z.string().min(1, "End date required"),
  endTime: z.string().min(1, "End time required"),
});
type ProposalForm = z.infer<typeof proposalSchema>;

function getUnixTimestamp(date: string, time: string) {
  if (!date || !time) return 0;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return Math.floor(
    new Date(year, month - 1, day, hour, minute).getTime() / 1000
  );
}

function Create() {
  const { address } = useAccount({ type: "ModularAccountV2" });
  const { chain } = useChain();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ProposalForm>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: "",
      content: "",
      choices: [{ value: "Yes" }, { value: "No" }],
      start: "",
      startTime: "",
      end: "",
      endTime: "",
    },
    mode: "onTouched",
  });

  const { fields, append, remove } = useFieldArray<ProposalForm>({
    control: form.control,
    name: "choices",
  });

  async function onSubmit(values: ProposalForm) {
    setFormError(null);
    if (!address || !chain?.id) {
      setFormError("Please connect your wallet.");
      return;
    }
    const start = getUnixTimestamp(values.start, values.startTime);
    const end = getUnixTimestamp(values.end, values.endTime);
    if (end <= start) {
      setFormError("End time must be after start time.");
      return;
    }
    setIsSubmitting(true);
    const result = await createProposal({
      title: values.title,
      content: values.content,
      choices: values.choices.map((c) => c.value),
      start,
      end,
      address,
      chainId: chain.id,
    });
    setIsSubmitting(false);
    if (result?.serverError) {
      setFormError(result.serverError || "Failed to create proposal.");
      return;
    }
    if (result?.validationErrors) {
      setFormError("Validation failed. Please check your input.");
      return;
    }
    if (!result?.data) {
      setFormError("Failed to create proposal.");
      return;
    }
    router.push("/vote");
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex flex-wrap items-start justify-center p-2">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full p-5 md:w-2/5 space-y-6"
          >
            <FormField
              name="title"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="[#BrandName] Campaign Voting"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="content"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your proposal..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>Choices</FormLabel>
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2 mb-2">
                  <FormField
                    name={`choices.${idx}.value`}
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder={`Choice ${idx + 1}`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fields.length > 2 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(idx)}
                      aria-label="Remove choice"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                onClick={() => append({ value: "" })}
              >
                Add Choice
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="start"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="startTime"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="end"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="endTime"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {formError && (
              <div className="text-red-500 text-sm font-medium">
                {formError}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </Suspense>
  );
}

export { Create };
