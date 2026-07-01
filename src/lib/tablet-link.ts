import { randomUUID } from "crypto";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";

export type TabletIdentifiers = {
  license?: string | null;
  discord?: string | null;
  steam?: string | null;
  fivem?: string | null;
};

type LinkedUser = {
  id: string;
  name: string;
  surname: string;
  email: string;
  badge: string;
  department: string;
  rank: string;
};

type LinkRow = {
  id: string;
  userId: string;
  characterId: string | null;
  license: string | null;
  discord: string | null;
  steam: string | null;
  fivem: string | null;
};

function cleanIdentifier(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned && cleaned.length > 0 ? cleaned : null;
}

function normalizeIdentifiers(identifiers: TabletIdentifiers) {
  return {
    license: cleanIdentifier(identifiers.license),
    discord: cleanIdentifier(identifiers.discord),
    steam: cleanIdentifier(identifiers.steam),
    fivem: cleanIdentifier(identifiers.fivem),
  };
}

function hasAnyIdentifier(identifiers: ReturnType<typeof normalizeIdentifiers>) {
  return Boolean(identifiers.license || identifiers.discord || identifiers.steam || identifiers.fivem);
}

async function ensureLinkTable() {
  // Crea la tabella se non esiste (schema nuovo con characterId)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS fdo_tablet_user_links (
      id VARCHAR(191) NOT NULL,
      userId VARCHAR(191) NOT NULL,
      characterId VARCHAR(191) NULL,
      license VARCHAR(191) NULL,
      discord VARCHAR(191) NULL,
      steam VARCHAR(191) NULL,
      fivem VARCHAR(191) NULL,
      firstLinkedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      lastLoginAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      lastCharacterName VARCHAR(191) NULL,
      PRIMARY KEY (id),
      UNIQUE KEY ux_tablet_links_characterId (characterId),
      INDEX idx_tablet_links_userId (userId),
      INDEX idx_tablet_links_license (license),
      CONSTRAINT fk_tablet_links_user FOREIGN KEY (userId) REFERENCES fdo_users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Migrazione per tabelle esistenti: aggiunge characterId se mancante
  await prisma.$executeRawUnsafe(`
    ALTER TABLE fdo_tablet_user_links
    ADD COLUMN IF NOT EXISTS characterId VARCHAR(191) NULL AFTER userId
  `).catch(() => {
    // MySQL < 8.0 non supporta IF NOT EXISTS su ALTER COLUMN — ignora
  });
}

// Cerca prima per characterId (preciso), poi fallback su identifiers (backward compat)
async function findLinkByCharacterOrIdentifiers(
  characterId: string | null,
  identifiers: ReturnType<typeof normalizeIdentifiers>
): Promise<LinkRow | null> {
  if (characterId) {
    const rows = await prisma.$queryRawUnsafe<LinkRow[]>(
      `SELECT id, userId, characterId, license, discord, steam, fivem
       FROM fdo_tablet_user_links WHERE characterId = ? LIMIT 1`,
      characterId
    );
    if (rows[0]) return rows[0];
  }

  // Fallback: lookup per identifier (per link senza characterId)
  if (!hasAnyIdentifier(identifiers)) return null;

  const whereClauses: string[] = [];
  const params: string[] = [];

  if (identifiers.license) { whereClauses.push("license = ?"); params.push(identifiers.license); }
  if (identifiers.discord) { whereClauses.push("discord = ?"); params.push(identifiers.discord); }
  if (identifiers.steam)   { whereClauses.push("steam = ?");   params.push(identifiers.steam); }
  if (identifiers.fivem)   { whereClauses.push("fivem = ?");   params.push(identifiers.fivem); }

  const query = `
    SELECT id, userId, characterId, license, discord, steam, fivem
    FROM fdo_tablet_user_links
    WHERE (${whereClauses.join(" OR ")}) AND characterId IS NULL
    LIMIT 1
  `;
  const rows = await prisma.$queryRawUnsafe<LinkRow[]>(query, ...params);
  return rows[0] || null;
}

async function getLinkedUser(userId: string): Promise<LinkedUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      badge: true,
      department: true,
      rank: true,
    },
  });
}

async function touchLink(linkId: string, characterName?: string | null) {
  await prisma.$executeRawUnsafe(
    `UPDATE fdo_tablet_user_links SET lastLoginAt = NOW(3), lastCharacterName = ? WHERE id = ?`,
    cleanIdentifier(characterName) || null,
    linkId
  );
}

export async function resolveTabletLinkedUser(input: {
  identifiers: TabletIdentifiers;
  characterId?: string | null;
  characterName?: string | null;
}) {
  await ensureLinkTable();

  const identifiers = normalizeIdentifiers(input.identifiers);
  const characterId = cleanIdentifier(input.characterId);
  const link = await findLinkByCharacterOrIdentifiers(characterId, identifiers);

  if (!link) {
    return { linked: false as const };
  }

  const user = await getLinkedUser(link.userId);
  if (!user) {
    return { linked: false as const };
  }

  await touchLink(link.id, input.characterName);

  return {
    linked: true as const,
    user,
  };
}

export async function loginAndLinkTabletUser(input: {
  email: string;
  password: string;
  identifiers: TabletIdentifiers;
  characterId?: string | null;
  characterName?: string | null;
}) {
  await ensureLinkTable();

  const identifiers = normalizeIdentifiers(input.identifiers);
  const characterId = cleanIdentifier(input.characterId);

  if (!hasAnyIdentifier(identifiers) && !characterId) {
    throw new Error("Nessun identificatore FiveM disponibile per associare l'account");
  }

  const user = await prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() } });
  if (!user) {
    return { success: false as const, error: "Credenziali non valide" };
  }

  const validPassword = await compare(input.password, user.password);
  if (!validPassword) {
    return { success: false as const, error: "Credenziali non valide" };
  }

  // Verifica che il characterId non sia già associato a un altro operatore
  if (characterId) {
    const existingByChar = await prisma.$queryRawUnsafe<LinkRow[]>(
      "SELECT id, userId, characterId, license, discord, steam, fivem FROM fdo_tablet_user_links WHERE characterId = ? LIMIT 1",
      characterId
    );
    if (existingByChar[0] && existingByChar[0].userId !== user.id) {
      return { success: false as const, error: "Questo personaggio è già associato a un altro operatore" };
    }
  }

  // Cerca link esistente per questo personaggio specifico
  const existingRows = characterId
    ? await prisma.$queryRawUnsafe<LinkRow[]>(
        "SELECT id, userId, characterId, license, discord, steam, fivem FROM fdo_tablet_user_links WHERE userId = ? AND characterId = ? LIMIT 1",
        user.id,
        characterId
      )
    : await prisma.$queryRawUnsafe<LinkRow[]>(
        "SELECT id, userId, characterId, license, discord, steam, fivem FROM fdo_tablet_user_links WHERE userId = ? AND characterId IS NULL LIMIT 1",
        user.id
      );
  const existingLink = existingRows[0] || null;

  if (existingLink) {
    await prisma.$executeRawUnsafe(
      `UPDATE fdo_tablet_user_links
       SET license = ?, discord = ?, steam = ?, fivem = ?, lastLoginAt = NOW(3), lastCharacterName = ?
       WHERE id = ?`,
      identifiers.license || existingLink.license,
      identifiers.discord || existingLink.discord,
      identifiers.steam || existingLink.steam,
      identifiers.fivem || existingLink.fivem,
      cleanIdentifier(input.characterName) || null,
      existingLink.id
    );
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO fdo_tablet_user_links
       (id, userId, characterId, license, discord, steam, fivem, firstLinkedAt, lastLoginAt, lastCharacterName)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3), ?)`,
      randomUUID(),
      user.id,
      characterId,
      identifiers.license,
      identifiers.discord,
      identifiers.steam,
      identifiers.fivem,
      cleanIdentifier(input.characterName) || null
    );
  }

  return {
    success: true as const,
    user: {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      badge: user.badge,
      department: user.department,
      rank: user.rank,
    },
  };
}
