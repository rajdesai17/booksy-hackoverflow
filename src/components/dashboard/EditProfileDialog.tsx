import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Profile {
  id: string;
  full_name: string;
  contact_number?: string;
  address?: string;
  city?: string;
  bio?: string;
  user_type: 'provider' | 'customer';
}

interface EditProfileDialogProps {
  profile: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProfileDialog = ({ profile, open, onOpenChange }: EditProfileDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: async (formData: Partial<Profile>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', profile?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    updateProfile.mutate({
      full_name: formData.get('full_name') as string,
      contact_number: formData.get('contact_number') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      bio: formData.get('bio') as string,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              name="full_name"
              defaultValue={profile?.full_name}
              required
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Contact Number</label>
            <input
              name="contact_number"
              type="tel"
              defaultValue={profile?.contact_number}
              className="w-full p-2 border rounded-md"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              name="address"
              defaultValue={profile?.address}
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="Enter your address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              name="city"
              defaultValue={profile?.city}
              className="w-full p-2 border rounded-md"
            />
          </div>

          {profile?.user_type === 'provider' && (
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                name="bio"
                defaultValue={profile?.bio}
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Tell us about yourself and your services"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={updateProfile.isLoading}>
            {updateProfile.isLoading ? "Updating..." : "Update Profile"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 