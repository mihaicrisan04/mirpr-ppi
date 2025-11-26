import betterAuth from "@convex-dev/better-auth/convex.config";
import agent from "@convex-dev/agent/convex.config";
import rag from "@convex-dev/rag/convex.config";
import resend from "@convex-dev/resend/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(betterAuth);
app.use(agent);
app.use(rag);
app.use(resend);

export default app;
