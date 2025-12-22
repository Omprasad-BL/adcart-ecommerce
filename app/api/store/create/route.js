// import { getAuth } from "@clerk/nextjs/dist/types/server";
import { NextResponse } from "next/server";

import { auth, getAuth } from "@clerk/nextjs/server";
import imageKit from "@/configs/imageKit"; // import the instance
import prisma from "@/lib/prisma";

// create the store
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const formData = await request.formData();
    const name = formData.get("name");
    const username = formData.get("username");
    const description = formData.get("description");
    const email = formData.get("email");
    const contact = formData.get("contact");
    const address = formData.get("address");
    const image = formData.get("image");

    if (
      !name ||
      !username ||
      !description ||
      !email ||
      !contact ||
      !address ||
      !image
    ) {
      return NextResponse.json(
        { error: "missing store information" },
        { status: 400 }
      );
    }

    const store = await prisma.store.findFirst({
      where: {
        userId,
      },
    });

    // is user is registered provide store
    if (store) {
      return NextResponse.json({ error: store.status }, { status: 400 });
    }
    // if user name existed
    const isUsernameTaken = await prisma.store.findFirst({
      where: {
        username: username.toLowerCase(),
      },
    });

    if (isUsernameTaken) {
      return NextResponse.json(
        { error: "username is already taken" },
        { status: 400 }
      );
    }

    // image upload to imagekit
    const buffer = Buffer.from(await image.arrayBuffer());
    const response = await imageKit.upload({
      file: buffer,
      fileName: image.name,
      folder: "logos",
    });

    const optimizedImage = imageKit.url({
      path: response.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "512" },
      ],
    });

    const newStore = await prisma.store.create({
      data: {
        userId,
        name,
        description,
        username: username.toLowerCase(),
        email,
        contact,
        address,
        logo: optimizedImage,
      },
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        store: {
          connect: {
            id: newStore.id,
          },
        },
      },
    });
    return NextResponse.json({ message: "applied waiting for approval" });
  } catch (error) {
    console.log("store creation error", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

// check is user have already registered store if yess then send status of the store
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    // check if user is already have store
    const store = await prisma.store.findFirst({
      where: {
        userId: userId,
      },
    });

    if (store) {
      console.log(store);
      
      return NextResponse.json({ status: store.status });
    }
  } catch (error) {
    console.log("store status error", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
