"use client";

import { Button } from "@/components/shadcnui/button";
import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Field, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { LoaderIcon, SaveIcon, UploadIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type ProfileData = {
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: string;
};

const ProfilePage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newUsername, setNewUsername] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          router.push("/auth");
          return;
        }
        const data = await res.json();
        if (!data.user) {
          router.push("/auth");
          return;
        }
        setProfile(data.user);
        setDisplayName(data.user.displayName || "");
        setAvatarUrl(data.user.avatarUrl || "");
        setNewUsername(data.user.username || "");
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (displayName.trim() && displayName.trim() !== profile?.displayName) {
        body.displayName = displayName.trim();
      }
      if (avatarUrl.trim() && avatarUrl.trim() !== profile?.avatarUrl) {
        body.avatarUrl = avatarUrl.trim();
      }
      if (newUsername.trim() && newUsername.trim() !== profile?.username) {
        body.username = newUsername.trim();
      }

      if (Object.keys(body).length === 0) {
        toast.info("No changes to save");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/user/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully!");
      setProfile(result.user);
      setDisplayName(result.user.displayName || "");
      setAvatarUrl(result.user.avatarUrl || "");
      setNewUsername(result.user.username || "");
    } catch {
      toast.error("Network error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = () => {
    const url = prompt(
      "Enter the URL of your new avatar picture:",
      avatarUrl || "https://",
    );
    if (url && url.trim()) {
      setAvatarUrl(url.trim());
    }
  };

  if (loading) {
    return (
      <section className="flex min-h-dvh items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin" />
      </section>
    );
  }

  if (!profile) return null;

  return (
    <section className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center text-2xl font-semibold">
          Profile Settings
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {profile.avatarUrl && profile.avatarUrl.startsWith("http") ?
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="border-primary h-24 w-24 rounded-full border-2 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              : <div className="bg-muted border-primary flex h-24 w-24 items-center justify-center rounded-full border-2">
                  <UserIcon className="text-muted-foreground h-10 w-10" />
                </div>
              }
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAvatarUpload}>
              <UploadIcon className="mr-2 h-4 w-4" />
              Change Avatar
            </Button>
            <div className="text-muted-foreground text-xs">
              Paste an image URL to set your avatar
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="cursor-not-allowed opacity-60"
              />
            </div>

            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Your username"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="displayName">Display Name</FieldLabel>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </Field>

            <div className="bg-muted/30 rounded-md border px-3 py-2">
              <span className="text-muted-foreground text-xs">Role:</span>{" "}
              <span className="text-sm font-medium">{profile.role}</span>
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={saving}
            onClick={handleSave}>
            {saving ?
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            : <>
                <SaveIcon className="mr-2 h-4 w-4" /> Save Changes
              </>
            }
          </Button>

          <div className="text-center">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-primary text-sm">
              Back to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default ProfilePage;
