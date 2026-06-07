import { db, settingsTable } from "@workspace/db";

async function getWebhookUrl(): Promise<string | null> {
  const rows = await db.select().from(settingsTable);
  return rows.find(r => r.key === "discordWebhookUrl")?.value || null;
}

async function sendWebhook(payload: object): Promise<void> {
  const url = await getWebhookUrl();
  if (!url) return;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export async function webhookMatchCreated(opts: {
  winnerName: string;
  loserName: string;
  gamemodeName: string;
  ratingChange: number;
  score?: string | null;
}): Promise<void> {
  await sendWebhook({
    embeds: [{
      title: "Match Recorded",
      color: 0x22c55e,
      description: `**${opts.winnerName}** defeated **${opts.loserName}** in **${opts.gamemodeName}**`,
      fields: [
        { name: "ELO Change", value: `+${opts.ratingChange} / -${opts.ratingChange}`, inline: true },
        ...(opts.score ? [{ name: "Score", value: opts.score, inline: true }] : []),
      ],
      timestamp: new Date().toISOString(),
    }],
  });
}

export async function webhookTierPromotion(opts: {
  playerName: string;
  gamemodeName: string;
  fromTier: string | null;
  toTier: string;
  newRating: number;
}): Promise<void> {
  await sendWebhook({
    embeds: [{
      title: "Tier Promotion",
      color: 0x8b5cf6,
      description: `**${opts.playerName}** was promoted in **${opts.gamemodeName}**`,
      fields: [
        { name: "From", value: opts.fromTier ?? "Unranked", inline: true },
        { name: "To",   value: opts.toTier,                 inline: true },
        { name: "New Rating", value: String(opts.newRating), inline: true },
      ],
      timestamp: new Date().toISOString(),
    }],
  });
}

export async function webhookAnnouncement(opts: {
  title: string;
  content: string;
  authorName: string;
  type: string;
}): Promise<void> {
  await sendWebhook({
    embeds: [{
      title: `Announcement: ${opts.title}`,
      color: 0x3b82f6,
      description: opts.content.slice(0, 300) + (opts.content.length > 300 ? "…" : ""),
      fields: [
        { name: "Type",   value: opts.type,       inline: true },
        { name: "Author", value: opts.authorName, inline: true },
      ],
      timestamp: new Date().toISOString(),
    }],
  });
}
