import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Update user cart
export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    const { cart } = await request.json();
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        cart: cart,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "an internal server error occured ",
      },
      {
        status: 500,
      }
    );
  }
}

// get user cart
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return NextResponse.json({ cart: user.cart });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "an internal server error occured ",
      },
      {
        status: 500,
      }
    );
  }
}
