import { create } from "zustand";
import { supabase } from "@/lib/supabase";

interface Profile {
  name: string;
  avatar_url: string;
}

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar_url?: string }) => Promise<void>;
  uploadAvatar: (blob: Blob, filename?: string) => Promise<string>;
}

export const useProfile = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,

  fetchProfile: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    set({ loading: true });

    const { data, error } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      set({ loading: false });
      return;
    }

    if (data) {
      set({ profile: data, loading: false });
    } else {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ id: user.id, name: "", avatar_url: "" });

      if (!insertError) {
        set({ profile: { name: "", avatar_url: "" }, loading: false });
      } else {
        console.error("Failed to create profile row:", insertError);
        set({ profile: { name: "", avatar_url: "" }, loading: false });
      }
    }
  },

  updateProfile: async (data) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;

    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...updates });

    if (error) throw error;

    const current = get().profile ?? { name: "", avatar_url: "" };
    set({ profile: { ...current, ...data } });
  },

  uploadAvatar: async (blob, filename) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const ext = filename?.split(".").pop() ?? "png";
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

    const url = urlData.publicUrl;

    await get().updateProfile({ avatar_url: url });

    return url;
  },
}));
