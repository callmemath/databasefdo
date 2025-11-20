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
          rank: user.rank
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
        token.rank = user.rank;
      }
      return token;
    },
    async session({ session, token }) {
      // Passa i dati dal token alla sessione
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.badge = token.badge as string;
        session.user.department = token.department as string;
        session.user.rank = token.rank as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // URL personalizzata per la pagina di login
  },
  session: {
    strategy: "jwt", // Usa JWT per la gestione delle sessioni
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
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
    rank: string;
  }

  interface Session {
    user: {
      id: string;
      badge: string;
      department: string;
      rank: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    badge: string;
    department: string;
    rank: string;
  }
}
