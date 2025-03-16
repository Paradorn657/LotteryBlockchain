import SignUpForm from "@/components/form/signupform";
import { redirect } from "next/navigation";

export default async function SignUp() {
    // const session = await authSession();
    // if (session?.user) {
    //     if (session?.user.role === "admin") {
    //         return redirect("/admin");
    //     }
    //     else {
    //         return redirect("/");
    //     }
    // }
    return (
        <div>
            <SignUpForm />
        </div>
    )
}