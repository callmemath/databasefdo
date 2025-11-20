import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenziali",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@fdo.it" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        try {
          // Cerca l'utente nel database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log("Utente non trovato");
            return null;
          }

          // Verifica la password (usando bcryptjs per comparare l'hash)
          const passwordMatch = await compare(credentials.password, user.password);

          if (!passwordMatch) {
            console.log("Password non corretta");
            return null;
          }

          // Non includere la password nell'oggetto utente restituito
          const { password, ...userWithoutPass } = user;
          return userWithoutPass;
        } catch (error) {
          console.error("Errore durante l'autorizzazione:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.badge = token.badge as string;
        session.user.department = token.department as string;
        session.user.rank = token.rank as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.badge = user.badge;
        token.department = user.department;
        token.rank = user.rank;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  // Usa la variabile d'ambiente per il segreto
  secret: process.env.NEXTAUTH_SECRET,
  // Configura l'adattatore Prisma per memorizzare sessioni, account, ecc.
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
