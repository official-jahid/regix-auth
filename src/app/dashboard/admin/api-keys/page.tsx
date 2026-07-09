"use client";

import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Field, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  AlertTriangleIcon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  LoaderIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const AdminApiKeysPage = () => {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPerms, setNewKeyPerms] = useState("read");
  const [newKeyExpiry, setNewKeyExpiry] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const loadedRef = useRef(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/keys/manage");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth");
          return;
        }
        if (res.status === 403) {
          toast.error("You don't have permission to manage API keys");
          router.push("/dashboard");
          return;
        }
        return;
      }
      const data = await res.json();
      setKeys(data.keys || []);
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast.error("Key name is required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/keys/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          permissions: newKeyPerms,
          expiresInDays: newKeyExpiry ? parseInt(newKeyExpiry) : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCreatedKey(data.key);
        setShowKey(true);
        setNewKeyName("");
        setNewKeyPerms("read");
        setNewKeyExpiry("");
        setShowCreateForm(false);
        toast.success("API key created successfully!");
        loadedRef.current = false;
        await fetchKeys();
      } else {
        toast.error(data.error || "Failed to create API key");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (keyId: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/keys/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, isActive: !currentActive }),
      });

      if (res.ok) {
        toast.success(currentActive ? "Key revoked" : "Key activated");
        loadedRef.current = false;
        await fetchKeys();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update key");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleDelete = async (keyId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this API key? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/keys/manage?keyId=${keyId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("API key deleted");
        loadedRef.current = false;
        await fetchKeys();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete key");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPermissionBadge = (perms: string) => {
    return perms.split(",").map((p) => (
      <Badge
        key={p.trim()}
        variant={
          p.trim() === "admin" ? "default"
          : p.trim() === "write" ?
            "secondary"
          : "outline"
        }
        className="mr-1">
        {p.trim()}
      </Badge>
    ));
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground text-sm">
            Manage API keys for external application authentication
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          {showCreateForm ? "Cancel" : "New Key"}
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Create New API Key</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="key-name">Key Name</FieldLabel>
              <Input
                id="key-name"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production App, My Desktop Client"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="key-perms">Permissions</FieldLabel>
              <select
                id="key-perms"
                value={newKeyPerms}
                onChange={(e) => setNewKeyPerms(e.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
                <option value="read">Read Only</option>
                <option value="read,write">Read & Write</option>
                <option value="read,write,admin">Full Access (Admin)</option>
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="key-expiry">
                Expires In (Days) - Optional
              </FieldLabel>
              <Input
                id="key-expiry"
                type="number"
                min="1"
                value={newKeyExpiry}
                onChange={(e) => setNewKeyExpiry(e.target.value)}
                placeholder="Leave empty for no expiry"
              />
            </Field>

            <Button
              onClick={handleCreate}
              disabled={creating || !newKeyName.trim()}
              className="w-full">
              {creating ?
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              : <KeyIcon className="mr-2 h-4 w-4" />}
              {creating ? "Creating..." : "Generate API Key"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Show Created Key */}
      {createdKey && (
        <Card className="border-yellow-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold">Your New API Key</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              This is the only time you will see this key. Copy it now and store
              it securely!
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted flex items-center justify-between rounded-md p-3 font-mono text-sm">
              <span className="truncate">
                {showKey ? createdKey : `${createdKey.substring(0, 12)}...`}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowKey(!showKey)}>
                  {showKey ?
                    <EyeOffIcon className="h-4 w-4" />
                  : <EyeIcon className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(createdKey)}>
                  {copied ?
                    <CheckIcon className="h-4 w-4" />
                  : <CopyIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreatedKey(null)}
              className="w-full">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Keys List */}
      <div className="space-y-3">
        {keys.length === 0 ?
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <KeyIcon className="text-muted-foreground mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">
                No API keys created yet
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Create your first API key to authenticate external applications
              </p>
            </CardContent>
          </Card>
        : keys.map((key) => (
            <Card
              key={key.id}
              className={key.isActive ? "" : "opacity-60"}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{key.name}</span>
                    <Badge variant={key.isActive ? "default" : "secondary"}>
                      {key.isActive ? "Active" : "Revoked"}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                    <span className="font-mono">{key.keyPrefix}...</span>
                    <span>|</span>
                    {getPermissionBadge(key.permissions)}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    Created: {formatDate(key.createdAt)}
                    {key.expiresAt &&
                      ` | Expires: ${formatDate(key.expiresAt)}`}
                    {key.lastUsedAt &&
                      ` | Last used: ${formatDate(key.lastUsedAt)}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(key.id, key.isActive)}>
                    {key.isActive ? "Revoke" : "Activate"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(key.id)}>
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>
    </div>
  );
};

export default AdminApiKeysPage;
