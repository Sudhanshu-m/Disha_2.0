import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface ProfilePictureUploadProps {
  profileId: string;
  currentPicture?: string;
  userName: string;
  onUploadSuccess: () => void;
}

export default function ProfilePictureUpload({
  profileId,
  currentPicture,
  userName,
  onUploadSuccess,
}: ProfilePictureUploadProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(currentPicture || "");
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (picture: string) => {
      return await apiRequest("PUT", `/api/profile/${profileId}`, {
        profilePicture: picture,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setOpen(false);
      onUploadSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (preview) {
      uploadMutation.mutate(preview);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center">
        <button
          onClick={() => setOpen(true)}
          className="relative group cursor-pointer"
          data-testid="button-upload-picture"
        >
          {currentPicture ? (
            <img
              src={currentPicture}
              alt={userName}
              className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg group-hover:opacity-75 transition-opacity"
              data-testid="img-profile-picture"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center border-4 border-slate-300 group-hover:bg-slate-300 transition-colors">
              <User className="w-12 h-12 text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all">
            <Upload className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
        <p className="text-sm text-slate-500 mt-2">Click to upload picture</p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Upload Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-32 h-32 rounded-lg object-cover border-2 border-primary"
                  data-testid="img-preview"
                />
              ) : (
                <div className="w-32 h-32 rounded-lg bg-slate-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                data-testid="input-file"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setPreview(currentPicture || "");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending || !preview}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
