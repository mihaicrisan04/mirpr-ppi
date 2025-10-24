import { getToken as getTokenNextjs } from "@convex-dev/better-auth/nextjs";
import { createAuth } from "@mirpr-ppi/backend/convex/auth";

export const getToken = () => getTokenNextjs(createAuth);
