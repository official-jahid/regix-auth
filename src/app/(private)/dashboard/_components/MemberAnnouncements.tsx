"use client";

import { useState } from "react";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { acknowledgeAnnouncement } from "@/server/announcements";

type Announcement = {
  id: string;
  title: string;
  message: string;
  urgency: string;
};

const urgencyVariant = (urgency: string) =>
  urgency === "critical" ? "destructive"
  : urgency === "warning" ? "default"
  : "secondary";

const MemberAnnouncements = ({ items }: { items: Announcement[] }) => {
  const [open, setOpen] = useState(items);
  const [busyId, setBusyId] = useState<string | null>(null);

  const acknowledge = async (id: string) => {
    setBusyId(id);
    const result = await acknowledgeAnnouncement(id);
    if (!("error" in result)) {
      setOpen((list) => list.filter((item) => item.id !== id));
    }
    setBusyId(null);
  };

  if (open.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {open.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{item.title}</CardTitle>
              <Badge variant={urgencyVariant(item.urgency)}>
                {item.urgency}
              </Badge>
            </div>
            <CardDescription className="whitespace-pre-wrap">
              {item.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              size="sm"
              disabled={busyId === item.id}
              onClick={() => acknowledge(item.id)}>
              {busyId === item.id ? "Saving" : "Acknowledge"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MemberAnnouncements;
