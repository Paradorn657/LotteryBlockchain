import SignInForm from "@/components/form/signinform";
import { auth } from "@/libs/auth";
import { redirect } from "next/navigation";

export default async function SignIn() {
    const session = await auth();
    return (
        <div>
            <SignInForm />
        </div>
    )
}