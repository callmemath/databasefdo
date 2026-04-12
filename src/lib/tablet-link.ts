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
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS fdo_tablet_user_links (
      id VARCHAR(191) NOT NULL,
      userId VARCHAR(191) NOT NULL,
      license VARCHAR(191) NULL,
      discord VARCHAR(191) NULL,
      steam VARCHAR(191) NULL,
      fivem VARCHAR(191) NULL,
      firstLinkedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      lastLoginAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      lastCharacterName VARCHAR(191) NULL,
      PRIMARY KEY (id),
      UNIQUE KEY ux_tablet_links_userId (userId),
      UNIQUE KEY ux_tablet_links_license (license),
      UNIQUE KEY ux_tablet_links_discord (discord),
      UNIQUE KEY ux_tablet_links_steam (steam),
      UNIQUE KEY ux_tablet_links_fivem (fivem),
      INDEX idx_tablet_links_userId (userId),
      CONSTRAINT fk_tablet_links_user FOREIGN KEY (userId) REFERENCES fdo_users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function findLinkByIdentifiers(identifiers: ReturnType<typeof normalizeIdentifiers>) {
  if (!hasAnyIdentifier(identifiers)) {
    return null;
  }

  const whereClauses: string[] = [];
  const params: string[] = [];

  if (identifiers.license) {
    whereClauses.push("license = ?");
    params.push(identifiers.license);
  }

  if (identifiers.discord) {
    whereClauses.push("discord = ?");
    params.push(identifiers.discord);
  }

  if (identifiers.steam) {
    whereClauses.push("steam = ?");
    params.push(identifiers.steam);
  }

  if (identifiers.fivem) {
    whereClauses.push("fivem = ?");
    params.push(identifiers.fivem);
  }

  const query = `
    SELECT id, userId, license, discord, steam, fivem
    FROM fdo_tablet_user_links
    WHERE ${whereClauses.join(" OR ")}
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
  characterName?: string | null;
}) {
  await ensureLinkTable();

  const identifiers = normalizeIdentifiers(input.identifiers);
  const link = await findLinkByIdentifiers(identifiers);

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
  characterName?: string | null;
}) {
  await ensureLinkTable();

  const identifiers = normalizeIdentifiers(input.identifiers);
  if (!hasAnyIdentifier(identifiers)) {
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

  const existingByIdentifiers = await findLinkByIdentifiers(identifiers);
  if (existingByIdentifiers && existingByIdentifiers.userId !== user.id) {
    return { success: false as const, error: "Questo account FiveM e' gia' associato a un altro operatore" };
  }

  const existingByUserRows = await prisma.$queryRawUnsafe<LinkRow[]>(
    "SELECT id, userId, license, discord, steam, fivem FROM fdo_tablet_user_links WHERE userId = ? LIMIT 1",
    user.id
  );
  const existingByUser = existingByUserRows[0] || null;

  if (existingByUser) {
    await prisma.$executeRawUnsafe(
      `
      UPDATE fdo_tablet_user_links
      SET license = ?, discord = ?, steam = ?, fivem = ?, lastLoginAt = NOW(3), lastCharacterName = ?
      WHERE id = ?
      `,
      identifiers.license || existingByUser.license,
      identifiers.discord || existingByUser.discord,
      identifiers.steam || existingByUser.steam,
      identifiers.fivem || existingByUser.fivem,
      cleanIdentifier(input.characterName) || null,
      existingByUser.id
    );
  } else {
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO fdo_tablet_user_links
      (id, userId, license, discord, steam, fivem, firstLinkedAt, lastLoginAt, lastCharacterName)
      VALUES (?, ?, ?, ?, ?, ?, NOW(3), NOW(3), ?)
      `,
      randomUUID(),
      user.id,
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
