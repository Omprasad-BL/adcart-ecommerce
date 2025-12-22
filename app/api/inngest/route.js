// export const runtime = "nodejs";   // ← VERY IMPORTANT (Fixes your Prisma/Neon error)

// import { serve } from "inngest/next";
// import { inngest } from "../../../inngest/client";
// import { syncUserCreation, syncUserDeletion, syncUserUpdation } from "@/inngest/functions";

// // Create an API that serves functions
// export const { GET, POST, PUT } = serve({
//   client: inngest,
//   functions: [
//     syncUserCreation,
//     syncUserUpdation,
//     syncUserDeletion
//   ],
// });

import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { deleteCouponOnExpiry, helloWorld, syncUserCreation, syncUserDeletion, syncUserUpdation } from "../../../inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncUserCreation, // <-- This is where you'll always add all your functions
    syncUserUpdation,
    syncUserDeletion,
    helloWorld,
    deleteCouponOnExpiry
  ],
});

