import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export async function POST(request) {   
try {
    const {userId,has}= getAuth(request)
    const {code}=await request.json();
    const coupon= await prisma.coupon.findUnique({
        where:{code:code.toUpperCase(),
        expiresAt:{gt:new Date()}
        }
        
    })

    
    if(!coupon){
        console.log("coupon is " + coupon);
        
        return NextResponse.json({error:"Invalid or expired coupon code"},{status:400})
    }

    if(coupon.forNewUser){
        const userOrders=await prisma.order.findFirst({
            where:{userId:userId},
        })

        if(userOrders.length>0){
            return NextResponse.json({error:"Coupon valid for new users only"},{status:400})
        }

         if(coupon.forMember){
            const hasPlusPlan=has({plan:"plus"})
            if(!hasPlusPlan){
                return NextResponse.json({error:"Coupon valid for plus members only"},{status:400})

            }
        }
    }


    return NextResponse.json({coupon})

} catch (error) {
    console.error(error);
    return NextResponse.json(
        {
        error:error.code || error.message || "an internal server error occured ",
        },
        {
        status: 500,
        }
    );
}
}