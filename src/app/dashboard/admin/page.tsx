"use client";

import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Input } from "@/components/shadcnui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcnui/tabs";
import {
  ArrowLeftIcon,
  BanIcon,
  CheckCircleIcon,
  CopyIcon,
  KeyIcon,
  LoaderIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  XCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface UserData {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  isBlacklisted: boolean;
  createdAt: string;
  discordAccount: { discordId: string; username: string | null } | null;
  premiumKeys: { key: string; isLifetime: boolean; expiresAt: string | null }[];
  devices: {
    hwid: string;
    sid: string | null;
    ip: string | null;
    lastSeenAt: string;
  }[];
  _count: { loginHistory: number; sessions: number };
}

interface KeyData {
  id: string;
  key: string;
  duration: number;
  isLifetime: boolean;
  isRedeemed: boolean;
  isActive: boolean;
  redeemedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  user: { username: string; email: string } | null;
}

const AdminDashboard = () => {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [keys, setKeys] = useState<KeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyCount, setKeyCount] = useState(1);
  const [keyDuration, setKeyDuration] = useState("30");
  const [keyIsLifetime, setKeyIsLifetime] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, keysRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/keys"),
      ]);

      if (!usersRes.ok || !keysRes.ok) {
        router.push("/dashboard");
        return;
      }

      const usersData = await usersRes.json();
      const keysData = await keysRes.json();
      setUsers(usersData.users);
      setKeys(keysData.keys);
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (
    userId: string,
    action: string,
    value?: string | null,
  ) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, value }),
    });
    const result = await res.json();
    if (res.ok) {
      toast.success(result.message);
      fetchData();
    } else {
      toast.error(result.error);
    }
  };

  const handleGenerateKeys = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/keys/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: keyCount,
          duration: parseInt(keyDuration),
          isLifetime: keyIsLifetime,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setGeneratedKeys(result.keys);
        toast.success(`Generated ${result.count} keys!`);
        fetchData();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to generate keys");
    } finally {
      setGenerating(false);
    }
  };

  const handleKeyAction = async (keyId: string, action: string) => {
    const res = await fetch("/api/admin/keys", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId, action }),
    });
    const result = await res.json();
    if (res.ok) {
      toast.success(result.message);
      fetchData();
    } else {
      toast.error(result.error);
    }
  };

  const copyAllKeys = () => {
    const text = generatedKeys.join("\n");
    navigator.clipboard.writeText(text);
    toast.success("All keys copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const activeUsers = users.filter((u) => u.isActive && !u.isBlacklisted);
  const blacklistedUsers = users.filter((u) => u.isBlacklisted);
  const totalKeys = keys.length;
  const redeemedKeys = keys.filter((k) => k.isRedeemed).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 pt-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard")}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">
              Manage users, keys, and system settings
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="px-3 py-2 sm:px-6 sm:py-4">
            <p className="text-muted-foreground text-xs font-medium sm:text-sm">
              Total Users
            </p>
            <p className="text-2xl font-bold sm:text-3xl">{users.length}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="px-3 py-2 sm:px-6 sm:py-4">
            <p className="text-muted-foreground text-xs font-medium sm:text-sm">
              Active Users
            </p>
            <p className="text-2xl font-bold text-green-500 sm:text-3xl">
              {activeUsers.length}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="px-3 py-2 sm:px-6 sm:py-4">
            <p className="text-muted-foreground text-xs font-medium sm:text-sm">
              Blacklisted
            </p>
            <p className="text-2xl font-bold text-red-500 sm:text-3xl">
              {blacklistedUsers.length}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="px-3 py-2 sm:px-6 sm:py-4">
            <p className="text-muted-foreground text-xs font-medium sm:text-sm">
              Keys (Redeemed)
            </p>
            <p className="text-2xl font-bold sm:text-3xl">
              {totalKeys}{" "}
              <span className="text-muted-foreground text-xs sm:text-sm">
                ({redeemedKeys})
              </span>
            </p>
          </CardHeader>
        </Card>
      </div>

      <Tabs
        defaultValue="users"
        className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <UserIcon className="mr-2 h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="keys">
            <KeyIcon className="mr-2 h-4 w-4" /> License Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="users"
          className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">User Management</h2>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Devices</th>
                      <th className="pb-3 font-medium">Premium</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b last:border-0">
                        <td className="py-3">
                          <p className="font-medium">{u.username}</p>
                          <p className="text-muted-foreground text-xs">
                            {u.email}
                          </p>
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={
                              u.role === "ADMIN" ? "default" : "secondary"
                            }>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {u.isBlacklisted ?
                            <Badge variant="destructive">Blacklisted</Badge>
                          : u.isActive ?
                            <Badge
                              variant="outline"
                              className="text-green-500">
                              Active
                            </Badge>
                          : <Badge
                              variant="outline"
                              className="text-yellow-500">
                              Inactive
                            </Badge>
                          }
                        </td>
                        <td className="py-3">
                          {u.devices.length > 0 ?
                            `${u.devices.length} device(s)`
                          : "None"}
                        </td>
                        <td className="py-3">
                          {u.premiumKeys.length > 0 ? "Yes" : "No"}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            {u.isBlacklisted ?
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleUserAction(u.id, "unblacklist")
                                }
                                title="Unblacklist">
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                              </Button>
                            : <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const reason = prompt(
                                    "Reason for blacklisting:",
                                  );
                                  if (reason !== null) {
                                    handleUserAction(u.id, "blacklist");
                                  }
                                }}
                                title="Blacklist">
                                <BanIcon className="h-4 w-4 text-red-500" />
                              </Button>
                            }
                            {u.isActive ?
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleUserAction(u.id, "deactivate")
                                }
                                title="Deactivate">
                                <XCircleIcon className="h-4 w-4 text-yellow-500" />
                              </Button>
                            : <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleUserAction(u.id, "activate")
                                }
                                title="Activate">
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                              </Button>
                            }
                            <Select
                              onValueChange={(value: string | null) =>
                                handleUserAction(u.id, "setRole", value)
                              }>
                              <SelectTrigger className="h-8 w-24">
                                <SelectValue placeholder="Role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">USER</SelectItem>
                                <SelectItem value="MOD">MOD</SelectItem>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Delete this user? This cannot be undone.",
                                  )
                                ) {
                                  handleUserAction(u.id, "delete");
                                }
                              }}
                              title="Delete">
                              <TrashIcon className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="keys"
          className="space-y-4">
          {/* Generate Keys */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Generate License Keys</h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Count</label>
                  <Input
                    type="number"
                    value={keyCount}
                    onChange={(e) => setKeyCount(parseInt(e.target.value) || 1)}
                    min={1}
                    max={100}
                    className="w-20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Duration</label>
                  <Select
                    value={keyDuration}
                    onValueChange={(value: string | null) => {
                      if (value) setKeyDuration(value);
                    }}
                    disabled={keyIsLifetime}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Day</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                      <SelectItem value="365">1 Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <input
                    type="checkbox"
                    id="lifetime"
                    checked={keyIsLifetime}
                    onChange={(e) => setKeyIsLifetime(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="lifetime"
                    className="text-sm">
                    Lifetime
                  </label>
                </div>
                <Button
                  onClick={handleGenerateKeys}
                  disabled={generating}>
                  <PlusIcon className="mr-2 h-4 w-4" /> Generate
                </Button>
              </div>

              {generatedKeys.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">Generated Keys:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAllKeys}>
                      <CopyIcon className="mr-2 h-3 w-3" /> Copy All
                    </Button>
                  </div>
                  <div className="bg-muted max-h-40 overflow-y-auto rounded-md p-3">
                    {generatedKeys.map((k, i) => (
                      <p
                        key={i}
                        className="font-mono text-sm">
                        {k}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keys List */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">All License Keys</h2>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Key</th>
                      <th className="pb-3 font-medium">Duration</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Redeemed By</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k) => (
                      <tr
                        key={k.id}
                        className="border-b last:border-0">
                        <td className="py-3 font-mono text-xs">{k.key}</td>
                        <td className="py-3">
                          {k.isLifetime ? "Lifetime" : `${k.duration} days`}
                        </td>
                        <td className="py-3">
                          {k.isRedeemed ?
                            <Badge
                              variant="outline"
                              className="text-green-500">
                              Redeemed
                            </Badge>
                          : k.isActive ?
                            <Badge variant="outline">Available</Badge>
                          : <Badge variant="destructive">Disabled</Badge>}
                        </td>
                        <td className="py-3">
                          {k.user ? k.user.username : "-"}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            {k.isActive ?
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleKeyAction(k.id, "deactivate")
                                }>
                                <XCircleIcon className="h-4 w-4 text-yellow-500" />
                              </Button>
                            : <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleKeyAction(k.id, "activate")
                                }>
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                              </Button>
                            }
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Delete this key?")) {
                                  handleKeyAction(k.id, "delete");
                                }
                              }}>
                              <TrashIcon className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
