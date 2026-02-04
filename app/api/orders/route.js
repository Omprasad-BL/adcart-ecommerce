import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// export async function POST(request) {
//   try {
//     const { userId ,has} = getAuth(request);
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { addressId, items, couponCode, paymentMethod } =
//       await request.json();

//     if (
//       !addressId ||
//       !items ||
//       items.length === 0 ||
//       !Array.isArray(items) ||
//       !paymentMethod
//     ) {
//       return NextResponse.json(
//         { error: "missing order details " },
//         { status: 400 },
//       );
//     }
//     let coupon = null;
//     if (couponCode) {
//       coupon = await prisma.coupon.findUnique({
//         where: { code: couponCode },
//       });

//       if (!coupon) {
//         console.log("coupon is " + coupon);

//         return NextResponse.json(
//           { error: "coupon not found " },
//           { status: 400 },
//         );
//       }
//     }

//     // for new user?
//     if (couponCode && coupon.forNewUser) {
//       const userOrders = await prisma.order.findFirst({
//         where: { userId: userId },
//       });

//       if (userOrders.length > 0) {
//         return NextResponse.json(
//           { error: "Coupon valid for new users only" },
//           { status: 400 },
//         );
//       }
//     }
//     const isPlusMember = has({ plan: "plus" });

//     if (couponCode && coupon.forMember) {
//       if (!isPlusMember) {
//         return NextResponse.json(
//           { error: "Coupon valid for plus members only" },
//           { status: 400 },
//         );
//       }
//     }

//     // group orders by  store id
//     const ordersByStore = new Map();
//     for (const item of items) {
//       const product = await prisma.product.findUnique({
//         where: { id: item.id },
//       });
//       const storeId = product.storeId;
//       if (!ordersByStore.has(storeId)) {
//         ordersByStore.set(storeId, []);
//       }

//       ordersByStore.get(storeId).push({ ...item, price: product.price });

//       let orderIds = [];
//       let fullAmount = 0;
//       let isShippingFeeAdded = false;

//       //create orders for each sellers
//       for (const [storeId, sellerItems] of ordersByStore.entries()) {
//         let total = sellerItems.reduce(
//           (sum, item) => sum + item.price * item.quantity,
//           0,
//         );

//         if (couponCode) {
//           total -= (total * coupon.discount) / 100;
//         }
//         if (isPlusMember && !isShippingFeeAdded) {
//           total += 5;
//           isShippingFeeAdded = true;
//         }

//         fullAmount += parseFloat(total.toFixed(2));

//         const order = await prisma.order.create({
//           data: userId,
//           storeId,
//           addressId,
//           total: parseFloat(total.toFixed(2)),
//           paymentMethod,
//           isCouponUsed: coupon ? true : false,
//           coupon: coupon ? coupon : {},
//           orderItems: {
//             create: sellerItems.map((item) => ({
//               productId: item.id,
//               quantity: item.quantity,
//               price: item.price,
//             })),
//           },
//         });
//       }
//       orderIds.push(order.id);
//     }

//     await prisma.user.update({
//       where: { id: userId },
//       data: { cart: {} },
//     });

//     return NextResponse.json({
//       message: "Orders places successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       {
//         error: error.code || error.message,
//       },
//       { status: 400 },
//     );
//   }
// }


// // get all orders for a user
// export async function GET(request) {
//     try {
//         const {userId}=getAuth(request);
//         const orders=await prisma.order.findMany({
//             where:{userId,OR:[
//                 {paymentMethod:paymentMethod.COD},
//                 {AND:[{paymentMethod:paymentMethod.STRIPE},{isPaid:true}]}
//             ]},
//             include:{
//                 orderItems:{include:{
//                     product:true
//                 }},
//                 address:true,
//             },
//             orderBy:{createdAt:'desc'}
//         })

//         return NextResponse.json(orders)

//     } catch (error) {
//         console.error(error);
//         return NextResponse.json({
//             error:error.message
//         },{
//             status:400
//         })
        
//     }
// }


export async function POST(request) {
  try {
    const { userId, has } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { addressId, items, couponCode, paymentMethod } = await request.json();
    const isPlusMember = has({ plan: "plus" });

    // 1. Group items by store FIRST
    const ordersByStore = {};
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.id } });
      if (!product) continue;
      
      if (!ordersByStore[product.storeId]) {
        ordersByStore[product.storeId] = [];
      }
      ordersByStore[product.storeId].push({ ...item, price: product.price });
    }

    // 2. Fetch Coupon
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    }

    // 3. Create orders after grouping is done
    const createdOrders = [];
    for (const [storeId, sellerItems] of Object.entries(ordersByStore)) {
      let total = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (coupon) {
        total -= (total * coupon.discount) / 100;
      }

      // Shipping Logic: If NOT plus member, add 5
      if (!isPlusMember) {
        total += 5;
      }

      const order = await prisma.order.create({
        data: {
          userId, // Fixed: data must be an object
          storeId,
          addressId,
          total: parseFloat(total.toFixed(2)),
          paymentMethod,
          orderItems: {
            create: sellerItems.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
      createdOrders.push(order);
    }

    // Clear cart after success
    await prisma.user.update({
      where: { id: userId },
      data: { cart: [] }, // Usually an empty array, not object
    });

    return NextResponse.json({ message: "Order placed successfully", orders: createdOrders });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const orders = await prisma.order.findMany({
            where: {
                userId,
                OR: [
                    { paymentMethod: "COD" },
                    { AND: [{ paymentMethod: "STRIPE" }, { isPaid: true }] }
                ]
            },
            include: {
                orderItems: { include: { product: true } },
                address: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}