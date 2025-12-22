import { getAuth } from "@clerk/nextjs/dist/types/server";
import { NextResponse } from "next/server";

// add a new product
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 403 });
    }
    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price =Number(formData.get("price"));
    const category = formData.get("category");
    const images = formData.getAll("images");

    if (
      !name ||
      !description ||
      !mrp ||
      !images.length<1||
      !price ||
      !category
    ) {
      return NextResponse.json(
        { error: "missing product details" },
        { status: 401 }
      );
    }


    const imagesUrl=await Promise.all(images.map(async(image)=>{
        const buffer = Buffer.from(await image.arrayBuffer());
        const response = await imagekit.upload({
          file: buffer,
          fileName: image.name,
          folder: "products",
        });
        const url= imagekit.url({
          path: response.filePath,
          transformation: [
            { quality: "auto" },
            { format: "webp" },
            { width: "1024" },
          ],
        });
        return url;
    }));

    await prisma.product.create({
      data:{
        name,
        description,
        mrp,
        price,
        category,
        images:imagesUrl,
        storeId
      }
    })

    return NextResponse.json({ message: "product added successfully" });

  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

// get all products or a seller
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 403 });
    }

    const products=await prisma.product.findMany({
        where:{
            storeId:storeId
        }
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.log("store creation error", error);
     return NextResponse.json(
      { error:error.code || error.message },
      { status: 400 }
    );
  }
}
