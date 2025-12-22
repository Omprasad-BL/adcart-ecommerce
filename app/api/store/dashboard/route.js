// get total order total earnings and total products
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    // get all orders for the seller
    const orders = await prisma.order.findMany({ where: { storeId } });

    const products = await prisma.product.findMany({ where: { storeId } });

    const ratings = await prisma.rating.findMany({
      productId: {
        in: products.map((product) => product.id),
      },
      include: { user: true, product: true },
    });

    const dahsboardData = {
      ratings,
      totalOrders: orders.length,
      totalEarnings: Math.round(
        orders.reduce((acc, order) => acc + order.total, 0)
      ),
      totalProducts: products.length,
    };
    return NextResponse.json({ dahsboardData });
  } catch (error) {
    console.log({"error":error.message});
    return NextResponse.json(
      { error:error.code || error.message },
      { status: 400 }
    );
    
  }
}
