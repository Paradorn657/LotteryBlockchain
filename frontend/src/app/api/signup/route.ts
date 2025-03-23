import { prisma } from "@/libs/db";
import { NextResponse } from "next/server"
// import { hash } from 'bcrypt'
import { hash } from 'argon2'
import * as z from 'zod';

const userSchema = z.object({
    username: z.string().min(1, "Username is requried").max(100),
    email: z.string().min(1,"Email is required").email('invalid email'),
    // address: z.string().min(1, "Address is required"),
    password: z
        .string()
        .min(1,'password is required')
        .min(8,'password must have than 8 characters'),
})

export async function POST(req: Request){
    try{
        const body = await req.json();
        const validated = userSchema.safeParse(body);
        console.log(body)
        if(!validated.success){
            return NextResponse.json(
                { user: null,message:"Invalid data"},
                {status: 400}
            )
        }
        console.log("err 404")

        const { email,username,password } = validated.data;
        console.log(body)
        const userExist = await prisma.user.findFirst({
            where: {
                email: email,
            }
        })
        console.log("TEST")
        if(userExist){
            return NextResponse.json(
                { user: null,message:"user with this email already exist"},
                {status: 409}
            )
        }

        const hashpassword = await hash(password)
        const newuser = await prisma.user.create({
          data:{
            name: username,
            email: email,
            password: hashpassword,
            address: ""
          }  
        })
        

        return NextResponse.json(body);
    } catch(error){
        console.error(error);
        return NextResponse.json(
            { user: null, message:"An error occurred"},
            {status: 500})
    }
}