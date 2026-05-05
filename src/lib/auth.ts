// File: /src/lib/auth.ts
import { DefaultSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenziali",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Verifica che email e password siano presenti
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Cerca l'utente nel database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Se l'utente non esiste, ritorna null
        if (!user) {
          return null;
        }

        // Verifica la password
        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        // Se la password non è valida, ritorna null
        if (!isPasswordValid) {
          return null;
        }

        // Ritorna i dati dell'utente (esclusa la password)
        return {
          id: user.id,
          email: user.email,
          name: `${user.name} ${user.surname}`,
          image: user.image,
          badge: user.badge,
          department: user.department,
          deptId: user.deptId ?? null,
          rank: user.rank,
          rankId: user.rankId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Quando l'utente fa il login, aggiungi i dati aggiuntivi al token
      if (user) {
        token.id = user.id;
        token.badge = user.badge;
        token.department = user.department;
        token.deptId = user.deptId;
        token.rank = user.rank;
        token.rankId = user.rankId;
      }
      return token;
    },
    async session({ session, token }) {
      // Passa i dati dal token alla sessione
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.badge = token.badge as string;
        session.user.department = token.department as string;
        session.user.deptId = (token.deptId ?? null) as number | null;
        session.user.rank = token.rank as string;
        session.user.rankId = (token.rankId ?? null) as number | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // URL personalizzata per la pagina di login
  },
  session: {
    strategy: "jwt", // Usa JWT per la gestione delle sessioni
    maxAge: 4 * 60 * 60, // 4 ore - dopo questo tempo devi rifare il login
    updateAge: 30 * 60, // Aggiorna la sessione ogni 30 minuti se attivo
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

// Estendi i tipi per NextAuth
declare module "next-auth" {
  interface User {
    id: string;
    badge: string;
    department: string;
    deptId: number | null;
    rank: string;
    rankId: number | null;
  }

  interface Session {
    user: {
      id: string;
      badge: string;
      department: string;
      deptId: number | null;
      rank: string;
      rankId: number | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    badge: string;
    department: string;
    deptId: number | null;
    rank: string;
    rankId: number | null;
  }
}
