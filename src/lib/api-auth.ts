import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

function getExpectedTabletApiToken(): string | null {
  return (
    process.env.FDO_TABLET_API_TOKEN ||
    process.env.TABLET_API_TOKEN ||
    null
  );
}

export function hasValidTabletApiToken(request: Request): boolean {
  const expectedToken = getExpectedTabletApiToken();
  if (!expectedToken) {
    return false;
  }

  const bearerToken = extractBearerToken(request.headers.get("authorization"));
  const xApiToken = request.headers.get("x-api-token")?.trim() || null;

  return bearerToken === expectedToken || xApiToken === expectedToken;
}

export async function getApiAuthContext(request: Request) {
  const session = await getServerSession(authOptions);

  const hasSessionUser = Boolean(session?.user);
  const hasTabletToken = hasValidTabletApiToken(request);
  const tabletUserId = request.headers.get("x-tablet-user-id")?.trim() || null;

  const officerIdFromSession = (session?.user as { id?: string } | undefined)?.id;
  const officerIdFromTablet = hasTabletToken ? tabletUserId : null;
  const fallbackOfficerId = process.env.FDO_TABLET_OFFICER_ID || process.env.TABLET_OFFICER_ID || null;

  return {
    isAuthorized: hasSessionUser || hasTabletToken,
    isServiceToken: hasTabletToken,
    session,
    officerId: officerIdFromSession || officerIdFromTablet || fallbackOfficerId,
  };
}
