import "next-auth";
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      badge: string;
      department: string;
      rank: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    badge: string;
    department: string;
    rank: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    badge: string;
    department: string;
    rank: string;
  }
}
