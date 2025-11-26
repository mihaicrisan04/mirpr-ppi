import { internal } from "./_generated/api";
import { internalAction, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

// Internal mutation to save feedback to database
export const saveFeedbackInternal = internalMutation({
  args: {
    feedback: v.string(),
    details: v.optional(v.string()),
    name: v.string(),
    email: v.string(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("feedback", {
      feedback: args.feedback,
      details: args.details,
      name: args.name,
      email: args.email,
      threadId: args.threadId,
      createdAt: Date.now(),
    });
  },
});

// Submit feedback - saves to database and sends emails (internal, called from agent tool)
export const submitFeedback = internalAction({
  args: {
    feedback: v.string(),
    details: v.optional(v.string()),
    name: v.string(),
    email: v.string(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; feedbackId?: string; error?: string }> => {
    const { feedback, details, name, email, threadId } = args;

    try {
      // Save feedback to database
      const feedbackId = await ctx.runMutation(
        internal.feedback.saveFeedbackInternal,
        {
          feedback,
          details,
          name,
          email,
          threadId,
        }
      );

      // Send confirmation email to user
      await ctx.runAction(internal.resend.sendFeedbackEmail, {
        toEmail: email,
        userName: name,
        feedbackContent: feedback,
        feedbackDetails: details,
      });

      // Optionally send notification to admin (you can configure admin email)
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await ctx.runAction(internal.resend.sendAdminNotification, {
          adminEmail,
          userName: name,
          userEmail: email,
          feedbackContent: feedback,
          feedbackDetails: details,
          threadId,
        });
      }

      return { success: true, feedbackId };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
});

// Query to list all feedback (for admin dashboard)
export const listFeedback = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("feedback").order("desc").collect();
  },
});

// Query to get feedback by email
export const getFeedbackByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("feedback")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .collect();
  },
});

