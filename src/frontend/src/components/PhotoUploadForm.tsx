import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { useState } from "react";
import { ExternalBlob } from "../backend";
import { useUploadPhoto } from "../hooks/useQueries";

interface PhotoUploadFormProps {
  photo: File;
  onUploadComplete: () => void;
  onCancel: () => void;
}

export default function PhotoUploadForm({
  photo,
  onUploadComplete,
  onCancel,
}: PhotoUploadFormProps) {
  const [caption, setCaption] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadMutation = useUploadPhoto();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const arrayBuffer = await photo.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress(
        (percentage) => {
          setUploadProgress(percentage);
        },
      );

      await uploadMutation.mutateAsync({
        blob,
        caption: caption.trim() || null,
      });

      onUploadComplete();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const photoUrl = URL.createObjectURL(photo);

  return (
    <div className="space-y-6">
      <div className="relative w-full aspect-[4/3] bg-muted rounded-2xl overflow-hidden shadow-lg">
        <img
          src={photoUrl}
          alt="Captured"
          className="w-full h-full object-cover"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="caption">Caption (optional)</Label>
          <Textarea
            id="caption"
            placeholder="Add a caption to your photo..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            disabled={uploadMutation.isPending}
            className="resize-none"
          />
        </div>

        {uploadMutation.isPending && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="font-medium">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {uploadMutation.isSuccess && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              Photo uploaded successfully!
            </AlertDescription>
          </Alert>
        )}

        {uploadMutation.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to upload photo. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={uploadMutation.isPending}
            size="lg"
            className="flex-1 gap-2"
          >
            <Upload className="w-5 h-5" />
            {uploadMutation.isPending ? "Uploading..." : "Upload Photo"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={uploadMutation.isPending}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
