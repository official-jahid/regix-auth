import { NextResponse } from "next/server";
import prisma from "@/lib/dbClient/prisma";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

const hits = new Map<string, number[]>();

const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  request.headers.get("x-real-ip")?.trim() ??
  "unknown";

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 1000) {
    const oldest = [...hits.keys()].slice(0, 200);
    for (const key of oldest) {
      hits.delete(key);
    }
  }

  return recent.length > MAX_REQUESTS;
};

export const GET = async (request: Request) => {
  const ip = clientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { status: "inactive", message: "Too many requests. Slow down." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim() ?? "";
  const deviceId = searchParams.get("device")?.trim() ?? "";

  if (!key) {
    return NextResponse.json({
      status: "inactive",
      message: "Key required.",
    });
  }

  const license = await prisma.licenseKey.findUnique({
    where: { key },
    include: {
      owner: { select: { username: true } },
    },
  });

  if (!license || !license.active) {
    return NextResponse.json({
      status: "inactive",
      message: "Invalid or banned key.",
    });
  }

  if (license.expiresAt && license.expiresAt < new Date()) {
    return NextResponse.json({
      status: "inactive",
      message: "License expired.",
    });
  }

  if (deviceId) {
    const activation = await prisma.activation.findFirst({
      where: { licenseId: license.id, deviceId },
      select: { id: true, active: true },
    });

    if (activation && !activation.active) {
      return NextResponse.json({
        status: "inactive",
        message: "Device revoked.",
      });
    }

    if (!activation) {
      await prisma.activation.create({
        data: { licenseId: license.id, deviceId, ip },
      });
    }
  }

  return NextResponse.json({
    status: "active",
    provider: license.provider,
    username: license.owner?.username ?? null,
    expiresAt: license.expiresAt ?? null,
  });
};
