import { Resend } from "@convex-dev/resend";
import { components } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

// Initialize Resend component
export const resend = new Resend(components.resend, {
  apiKey: process.env.RESEND_API_KEY ?? "",
  testMode: false,
});

// Send feedback confirmation email to user
export const sendFeedbackEmail = internalAction({
  args: {
    toEmail: v.string(),
    userName: v.string(),
    feedbackContent: v.string(),
    feedbackDetails: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const { toEmail, userName, feedbackContent, feedbackDetails } = args;

    try {
      // Send confirmation email to the user
      await resend.sendEmail(ctx, {
        from: "Feedback <delivered@resend.dev>",
        to: toEmail,
        subject: "Thank you for your feedback!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Thank you for your feedback, ${userName}!</h2>
            <p>We've received your feedback and appreciate you taking the time to share your thoughts with us.</p>
            <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin-top: 0;">Your Feedback:</h3>
              <p>${feedbackContent}</p>
              ${feedbackDetails ? `<p><strong>Additional Details:</strong> ${feedbackDetails}</p>` : ""}
            </div>
            <p>We'll review your feedback and use it to improve our service.</p>
            <p>Best regards,<br>The Team</p>
          </div>
        `,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
});

// Send notification email to admin about new feedback
export const sendAdminNotification = internalAction({
  args: {
    adminEmail: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    feedbackContent: v.string(),
    feedbackDetails: v.optional(v.string()),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const {
      adminEmail,
      userName,
      userEmail,
      feedbackContent,
      feedbackDetails,
      threadId,
    } = args;

    try {
      await resend.sendEmail(ctx, {
        from: "Feedback System <feedback@resend.dev>",
        to: adminEmail,
        subject: `New Feedback from ${userName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Feedback Received</h2>
            <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>From:</strong> ${userName} (${userEmail})</p>
              ${threadId ? `<p><strong>Thread ID:</strong> ${threadId}</p>` : ""}
              <h3>Feedback:</h3>
              <p>${feedbackContent}</p>
              ${feedbackDetails ? `<p><strong>Additional Details:</strong> ${feedbackDetails}</p>` : ""}
            </div>
            <p>Submitted at: ${new Date().toISOString()}</p>
          </div>
        `,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
});

