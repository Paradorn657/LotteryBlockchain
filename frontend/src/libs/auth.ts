import NextAuth, { AuthError, DefaultSession, NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { compare } from "bcryptjs";
import prisma from "./prisma";
import { hash, verify } from "argon2";

declare module "next-auth" {
    interface User {
        address: string;
    }
    interface Session {
        user: {
            address: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        address: string;
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
                    user = await prisma.user.findFirst({ where: { email } });
                    console.log(user)
                } catch (error) {
                    return null
                }

                if (!user) {
                    return null
                }

                const matched = await verify(user.password, password);
                // Compare password with the hashed password in the database
                // const matched = await compare(password, user.password as string);
                if (!matched) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    address: user.address
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.address = user.address;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id ?? "";
            session.user.address = token.address;
            return session;
        },
    },
    pages: {
        signIn: "/authorize/signin",
    },
    secret: process.env.AUTH_SECRET,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
