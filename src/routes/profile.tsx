import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { ArrowLeft, Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CropImageDialog } from "@/components/CropImageDialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/useAuth";
import { useProfile } from "@/store/useProfile";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Money Tracker" },
      { name: "description", content: "Kelola data profil Anda." },
    ],
  }),
  component: () => (
    <AppShell>
      <ProfilePage />
    </AppShell>
  ),
});

function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { profile, loading, fetchProfile, updateProfile, uploadAvatar } = useProfile();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [deleting, setDeleting] = useState(false);
  const pendingFile = useRef<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const avatarSrc = useMemo(() => {
    return avatarUrl ? `${avatarUrl}?t=${Date.now()}` : undefined;
  }, [avatarUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Maksimal ukuran avatar 2MB");
      return;
    }

    pendingFile.current = file;
    setCropImageSrc(URL.createObjectURL(file));
    setCropDialogOpen(true);
    e.target.value = "";
  };

  const handleCrop = async (croppedBlob: Blob) => {
    setCropDialogOpen(false);
    setCropImageSrc("");
    setUploading(true);

    try {
      const file = pendingFile.current;
      const filename = file?.name ?? "avatar.png";
      const url = await uploadAvatar(croppedBlob, filename);
      setAvatarUrl(url);
      toast.success("Foto profil berhasil diupload");
    } catch {
      toast.error("Gagal upload foto profil");
    } finally {
      setUploading(false);
      pendingFile.current = null;
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    setCropImageSrc("");
    pendingFile.current = null;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      toast.success("Profile berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await supabase.rpc("delete_account");
      localStorage.clear();
      useAuth.getState().signOut();
      navigate({ to: "/login" });
    } catch {
      toast.error("Gagal menghapus akun");
      setDeleting(false);
    }
  };

  const initials = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => navigate({ to: "/settings" })}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="text-xs text-muted-foreground">Akun</div>
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarSrc} alt="Avatar" />
            <AvatarFallback className="text-2xl font-semibold">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : initials}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      <div className="mt-8 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nama</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama lengkap"
            className="bg-surface"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input value={user?.email ?? ""} disabled className="bg-surface opacity-60" />
          <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="mt-8 h-12 w-full rounded-xl">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Menyimpan...
          </>
        ) : (
          "Simpan"
        )}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="mt-6 h-12 w-full rounded-xl border-destructive text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus Akun
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua data Anda — transaksi, kategori, budget, profil — akan dihapus permanen dari
              server. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Menghapus..." : "Ya, hapus akun saya"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CropImageDialog
        open={cropDialogOpen}
        image={cropImageSrc}
        onCrop={handleCrop}
        onCancel={handleCropCancel}
      />
    </div>
  );
}
