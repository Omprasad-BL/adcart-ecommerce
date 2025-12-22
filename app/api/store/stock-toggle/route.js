// toggle stock product
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json(
        { error: "missing details productId" },
        { status: 400 }
      );
    }
    const storeId = await authSeller(userId);
    if (!storeId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 403 });
    }

    // check if product exist
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: storeId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "product not found" }, { status: 404 });
    }

    await prisma.product.update({
      where: {
        id: productId,
        data: {
          inStock: !product.inStock,
        },
      },
    });

    return NextResponse.json({ message: "stock status updated suscessfully" });
  } catch (error) {
    console.log({ error: error.message });
    return NextResponse.json(
         { error:error.code || error.message },
         { status: 400 }
       );
  }
}
