import NextAuth, { AuthError, DefaultSession, NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { compare } from "bcryptjs";
import prisma from "./prisma";

declare module "next-auth" {
    interface User {
        role: string;
    }
    interface Session {
        user: {
            role: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role: string;
    }
}

const authConfig: NextAuthConfig = {
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const { email, password } = credentials as { email: string; password: string };

                let user;
                try {
                    // Fetch user from the database
                    user = await prisma.users.findFirst({ where: { email } });
                } catch (error) {
                    return null
                }

                if (!user) {
                    return null
                }

                // Compare password with the hashed password in the database
                const matched = await compare(password, user.password as string);
                if (!matched) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role.toString(),
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id ?? "";
            session.user.role = token.role;
            return session;
        },
    },
    pages: {
        signIn: "/authorize/signin",
    },
    secret: process.env.AUTH_SECRET,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
