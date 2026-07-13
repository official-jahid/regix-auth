import { serverEnv } from "./env/serverEnv";

const DISCORD_API_BASE = "https://discord.com/api/v10";

export async function sendDiscordDM(
  discordUserId: string,
  message: string,
): Promise<boolean> {
  const botToken = serverEnv.DISCORD_BOT_TOKEN;

  if (!botToken) {
    console.error("DISCORD_BOT_TOKEN not configured");
    return false;
  }

  try {
    // First, create a DM channel with the user
    const channelResponse = await fetch(
      `${DISCORD_API_BASE}/users/@me/channels`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipient_id: discordUserId }),
      },
    );

    if (!channelResponse.ok) {
      if (channelResponse.status === 404) {
        console.error(`Discord user not found: ${discordUserId}`);
      } else if (channelResponse.status === 403) {
        console.error(
          `Cannot send DM to user ${discordUserId} - DMs disabled or bot blocked`,
        );
      } else {
        console.error(
          `Failed to create DM channel: ${channelResponse.status} ${channelResponse.statusText}`,
        );
      }
      return false;
    }

    const channelData = await channelResponse.json();
    const channelId = channelData.id;

    // Send the message to the DM channel
    const messageResponse = await fetch(
      `${DISCORD_API_BASE}/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: message }),
      },
    );

    if (!messageResponse.ok) {
      console.error(
        `Failed to send DM: ${messageResponse.status} ${messageResponse.statusText}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Discord DM:", error);
    return false;
  }
}
