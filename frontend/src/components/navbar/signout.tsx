'use client';

import { signOut } from "next-auth/react";

export default function SignOut() {
    return (
        <li onClick={() => signOut()}><a>Logout</a></li>
    )
}