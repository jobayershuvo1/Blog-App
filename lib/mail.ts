import nodemailer from "nodemailer";
import { absoluteUrl } from "@/lib/utils";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "BlogForge";
const FROM_NAME = process.env.MAIL_FROM_NAME || SITE_NAME;

export function isMailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendArgs): Promise<boolean> {
  if (!isMailConfigured()) {
    console.warn(`[mail] Skipped "${subject}" to ${to} — GMAIL credentials not configured.`);
    return false;
  }
  try {
    const transport = getTransport();
    await transport.sendMail({
      from: `"${FROM_NAME}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("[mail] send failed:", err);
    return false;
  }
}

/** Shared branded wrapper for all transactional emails. */
function layout(title: string, bodyHtml: string, cta?: { label: string; url: string }): string {
  return `
  <div style="background:#f1f5f9;padding:32px 0;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.08);">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-.5px;">${SITE_NAME}</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">${title}</h2>
        <div style="color:#334155;font-size:15px;line-height:1.7;">${bodyHtml}</div>
        ${
          cta
            ? `<div style="margin:28px 0 8px;"><a href="${cta.url}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;">${cta.label}</a></div>`
            : ""
        }
      </div>
      <div style="padding:18px 32px;background:#f8fafc;color:#94a3b8;font-size:12px;text-align:center;">
        © ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.
      </div>
    </div>
  </div>`;
}

export const emails = {
  newAuthorRequest: (adminEmail: string, name: string, email: string) =>
    sendMail({
      to: adminEmail,
      subject: `New author request from ${name}`,
      html: layout(
        "New Author Request",
        `<p><strong>${name}</strong> (${email}) has requested to become an author.</p>
         <p>Review their application in the admin panel.</p>`,
        { label: "Review Request", url: absoluteUrl("/admin/author-requests") }
      ),
    }),

  authorApproved: (email: string, name: string) =>
    sendMail({
      to: email,
      subject: `Your author request was approved 🎉`,
      html: layout(
        `Welcome aboard, ${name}!`,
        `<p>Great news — your request to write for ${SITE_NAME} has been <strong>approved</strong>.</p>
         <p>You can now sign in and start publishing. Posts you submit go through a quick review before going live.</p>`,
        { label: "Sign In", url: absoluteUrl("/login") }
      ),
    }),

  authorRejected: (email: string, name: string, reason: string) =>
    sendMail({
      to: email,
      subject: `Update on your author request`,
      html: layout(
        `Hello ${name}`,
        `<p>Thank you for your interest in writing for ${SITE_NAME}. After review, we're unable to approve your request at this time.</p>
         <p style="background:#fef2f2;border-left:3px solid #ef4444;padding:12px 14px;border-radius:6px;"><strong>Reason:</strong> ${reason}</p>
         <p>You're welcome to apply again in the future.</p>`
      ),
    }),

  postApproved: (email: string, name: string, title: string, slug: string) =>
    sendMail({
      to: email,
      subject: `Your post "${title}" is now live`,
      html: layout(
        `Published! ✅`,
        `<p>Hi ${name}, your post <strong>"${title}"</strong> has been approved and is now public.</p>`,
        { label: "View Post", url: absoluteUrl(`/post/${slug}`) }
      ),
    }),

  postRejected: (email: string, name: string, title: string, reason: string) =>
    sendMail({
      to: email,
      subject: `Your post "${title}" needs changes`,
      html: layout(
        `Revisions requested`,
        `<p>Hi ${name}, your post <strong>"${title}"</strong> wasn't approved in its current form.</p>
         <p style="background:#fef2f2;border-left:3px solid #ef4444;padding:12px 14px;border-radius:6px;"><strong>Feedback:</strong> ${reason}</p>
         <p>Edit your post and resubmit when ready.</p>`,
        { label: "Edit Post", url: absoluteUrl("/dashboard/posts") }
      ),
    }),

  newMessage: (email: string, fromName: string, subject: string) =>
    sendMail({
      to: email,
      subject: `New message: ${subject}`,
      html: layout(
        `You have a new message`,
        `<p><strong>${fromName}</strong> sent you a message regarding "<em>${subject}</em>".</p>`,
        { label: "Open Inbox", url: absoluteUrl("/admin/messages") }
      ),
    }),

  passwordReset: (email: string, name: string, resetUrl: string) =>
    sendMail({
      to: email,
      subject: `Reset your ${SITE_NAME} password`,
      html: layout(
        `Reset your password`,
        `<p>Hi ${name}, we received a request to reset your password.</p>
         <p>Click the button below to choose a new one. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
        { label: "Reset Password", url: resetUrl }
      ),
    }),

  newsletterWelcome: (email: string) =>
    sendMail({
      to: email,
      subject: `Welcome to the ${SITE_NAME} newsletter`,
      html: layout(
        `You're subscribed! 📬`,
        `<p>Thanks for subscribing to ${SITE_NAME}. You'll be the first to know about new posts.</p>`,
        { label: "Browse Posts", url: absoluteUrl("/") }
      ),
    }),
};
