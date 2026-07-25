import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getOrCreateFirstCourseAssignment } from "@/db/course";
import { getDatabase } from "@/db";
import * as schema from "@/db/schema";

const productionUrl = "https://lovable-original-eight.vercel.app";

export const auth = betterAuth({
  appName: "Lovable Original",
  baseURL: process.env.BETTER_AUTH_URL ?? productionUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(getDatabase(), {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 20,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
    },
  },
  trustedOrigins: [
    productionUrl,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          await getOrCreateFirstCourseAssignment(createdUser.id);
        },
      },
    },
  },
  plugins: [nextCookies()],
});
