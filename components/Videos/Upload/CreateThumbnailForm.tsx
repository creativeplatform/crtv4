import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "../../ui/select"; // Adjust the import path as needed
import { Button } from "../../ui/button"; // Adjust the import path as needed
import { SparklesIcon } from "lucide-react";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getLivepeerAiGeneratedImages } from "@/app/api/livepeer/livepeerAiActions";
import { Media } from "livepeer/models/components";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";

interface FormValues {
  aiModel: string;
  prompt: string;
}

type CreateThumbnailFormProps = {
  onSelectThumbnailImages: (imageUrl: string) => void;
};

const CreateThumbnailForm = ({
  onSelectThumbnailImages,
}: CreateThumbnailFormProps) => {
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    defaultValues: {
      aiModel: "SG161222/RealVisXL_V4.0_Lightning",
      prompt: "",
    },
  });

  const [imagesUrl, setImagesUrl] = useState<Media[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    undefined
  );
  const [loading, setLoading] = useState<boolean>(false);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const response = await getLivepeerAiGeneratedImages({
        prompt: data.prompt,
        modelId: data.aiModel,
        safetyCheck: true,
        numImagesPerPrompt: 1,
      });
      if (response.success) {
        setImagesUrl((currentImages) => [
          ...currentImages,
          ...response.result.images,
        ]);
      } else {
        throw new Error(response.result);
      }
    } catch (err) {
      console.log("Error", JSON.stringify(err));
      setError("root", {
        message: "Error generating AI images",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Updated imagesUrl state:", imagesUrl);
  }, [imagesUrl]);

  const handleSelectionChange = (value: string) => {
    setSelectedImage(value);
    onSelectThumbnailImages(value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="aiModel"
        control={control}
        rules={{ required: "AI Model is required" }}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger
              className="w-[180px]"
              data-testid="create-thumbnail-select"
            >
              <SelectValue placeholder="Select A Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Model</SelectLabel>
                <SelectItem value="SG161222/RealVisXL_V4.0_Lightning">
                  RealVisXL
                </SelectItem>
                <SelectItem value="black-forest-labs/FLUX.1-schnell">
                  Black Forest
                </SelectItem>
                <SelectItem value="CompVis/stable-diffusion-v1-4">
                  CompVis
                </SelectItem>
                <SelectItem value="stabilityai/stable-diffusion-2">
                  Stability
                </SelectItem>
                <SelectItem value="Shakker-Labs/FLUX.1-dev-LoRA-One-Click-Creative-Template">
                  Shakker
                </SelectItem>
                <SelectItem value="aleksa-codes/flux-ghibsky-illustration">
                  Ghibsky
                </SelectItem>
                <SelectItem value="ByteDance/SDXL-Lightning">
                  Bytedance
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      />
      {errors.aiModel && (
        <p className="text-red-500">{errors.aiModel.message}</p>
      )}

      {/* Add a prompt input field */}
      <Controller
        name="prompt"
        control={control}
        rules={{ required: "Prompt is required" }}
        render={({ field }) => (
          <Textarea
            {...field}
            placeholder="Enter your prompt"
            className="w-full rounded border p-2"
            data-testid="create-thumbnail-prompt"
            rows={4}
          />
        )}
      />
      {errors.prompt && <p className="text-red-500">{errors.prompt.message}</p>}

      <Button type="submit" disabled={isSubmitting}>
        <SparklesIcon className="mr-1 h-4 w-4" />
        {isSubmitting ? "Generating..." : "Generate"}
      </Button>

      {errors["root"] && (
        <p className="text-red-500">{errors["root"].message}</p>
      )}

      {/* Render Skeletons while loading */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="rounded-md w-full h-[200px]" />
          ))}
        </div>
      ) : (
        <RadioGroup
          onValueChange={handleSelectionChange}
          value={selectedImage}
          className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
        >
          {imagesUrl.length === 0 && (
            <p className="col-span-full text-center text-gray-500">
              No images generated yet.
            </p>
          )}
          {imagesUrl.map((img, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <RadioGroupItem
                value={img.url}
                id={`thumbnail_checkbox_${idx}`}
                className="mb-2"
              />
              <Label htmlFor={`thumbnail_checkbox_${idx}`}>
                <Image
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  width={200}
                  height={200}
                  className="rounded-md border object-cover"
                />
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </form>
  );
};

export default CreateThumbnailForm;
