import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { useState } from "react";
import { ExternalBlob, MediaType } from "../backend";
import { useUploadMedia } from "../hooks/useQueries";

interface PhotoUploadFormProps {
  photo: File;
  mediaType?: MediaType;
  onUploadComplete: () => void;
  onCancel: () => void;
}

export default function PhotoUploadForm({
  photo,
  mediaType = MediaType.photo,
  onUploadComplete,
  onCancel,
}: PhotoUploadFormProps) {
  const [caption, setCaption] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadMutation = useUploadMedia();
  const isVideo = mediaType === MediaType.video;

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
        mediaType,
      });

      onUploadComplete();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const mediaUrl = URL.createObjectURL(photo);

  return (
    <div className="space-y-6">
      <div className="relative w-full aspect-[4/3] bg-muted border-2 border-foreground overflow-hidden">
        {isVideo ? (
          // biome-ignore lint/a11y/useMediaCaption: user-generated content without captions
          <video
            src={mediaUrl}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        ) : (
          <img
            src={mediaUrl}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-3 left-3 bg-foreground text-background px-2 py-0.5 text-xs font-black uppercase tracking-widest">
          {isVideo ? "VIDEO" : "PHOTO"}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="caption"
            className="font-bold uppercase tracking-wide text-xs"
          >
            Caption (optional)
          </Label>
          <Textarea
            id="caption"
            data-ocid="upload.textarea"
            placeholder={`Add a caption to your ${isVideo ? "video" : "photo"}...`}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            disabled={uploadMutation.isPending}
            className="resize-none border-2 border-foreground rounded-none"
          />
        </div>

        {uploadMutation.isPending && uploadProgress > 0 && (
          <div className="space-y-2" data-ocid="upload.loading_state">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-wide text-xs">
                Uploading...
              </span>
              <span className="font-black">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2 rounded-none" />
          </div>
        )}

        {uploadMutation.isSuccess && (
          <Alert
            className="border-2 border-foreground rounded-none"
            data-ocid="upload.success_state"
          >
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="font-bold uppercase tracking-wide text-xs">
              {isVideo ? "Video" : "Photo"} uploaded successfully!
            </AlertDescription>
          </Alert>
        )}

        {uploadMutation.isError && (
          <Alert
            variant="destructive"
            className="rounded-none border-2 border-foreground"
            data-ocid="upload.error_state"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-bold uppercase tracking-wide text-xs">
              Failed to upload. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={uploadMutation.isPending}
            size="lg"
            data-ocid="upload.submit_button"
            className="flex-1 gap-2 border-2 border-foreground bg-primary text-primary-foreground font-bold uppercase tracking-widest hover:bg-foreground hover:border-foreground"
          >
            <Upload className="w-5 h-5" />
            {uploadMutation.isPending
              ? "Uploading..."
              : `Upload ${isVideo ? "Video" : "Photo"}`}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={uploadMutation.isPending}
            size="lg"
            data-ocid="upload.cancel_button"
            className="border-2 border-foreground font-bold uppercase tracking-wide hover:bg-foreground hover:text-background"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
