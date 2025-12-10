import prisma from "@/lib/prisma";
import { inngest } from "./client";

// inngest function to save user to database

export const syncUserCreation = inngest.createFunction(
  { id: "synch-user-creation" },
  {
    event: "clerk/user.created",
  },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.create({
      data: {
        id: data.id,
        email: data.email_addresses[0].email_address,
        name: `${data.first_name} ${data.last_name}`,
        image: data.image_url,
      },
    });
  }
);

export const syncUserUpdation = inngest.createFunction(
  {
    id: "sync-user-update",
  },
  {
    event: "clerk/user.update",
  },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        email: data.email_addresses[0].email_address,
        name: `${data.first_name} ${data.last_name}`,
        image: data.image_url,
      },
    });
  }
);
