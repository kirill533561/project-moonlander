import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskTitle, dueDate, priority, planName, bucketName } = await request.json();

    if (!taskTitle || !dueDate) {
      return NextResponse.json({ error: "Missing taskTitle or dueDate" }, { status: 400 });
    }

    const due = new Date(dueDate);
    const now = new Date();
    const reminderTime = new Date(due.getTime() - 15 * 60 * 1000);

    if (reminderTime <= now) {
      return NextResponse.json({ message: "Due date already passed or too soon, skipping" });
    }

    const hoursUntilReminder = (reminderTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilReminder > 72) {
      return NextResponse.json({
        message: "Due date >72h out, daily cron will schedule closer to deadline",
        scheduledBy: "cron",
      });
    }

    const priorityEmoji: Record<string, string> = {
      urgent: "🔴",
      important: "🟡",
      medium: "🔵",
      low: "⚪",
    };

    const dueStr = due.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Project Moonlander <onboarding@resend.dev>",
      to: process.env.REMINDER_EMAIL!,
      subject: `⏰ Task due in 15 min: ${taskTitle}`,
      scheduledAt: reminderTime.toISOString(),
      html: `
        <div style="background:#0a0a1a;color:#e0e0e0;padding:32px;font-family:monospace;">
          <h1 style="color:#00ffff;font-size:20px;text-align:center;">⏰ DEADLINE APPROACHING</h1>
          <hr style="border-color:#2a2a4a;margin:20px 0;" />
          <div style="padding:16px;border-left:3px solid #ff4444;margin:12px 0;">
            <p style="font-size:18px;margin:0 0 8px;">
              ${priorityEmoji[priority] || "🔵"} <strong>${taskTitle}</strong>
            </p>
            <p style="color:#888;font-size:13px;margin:0;">
              ${planName || "Mission Plan"} → ${bucketName || "Bucket"}<br/>
              Due: <strong style="color:#ff4444;">${dueStr}</strong>
            </p>
          </div>
          <hr style="border-color:#2a2a4a;margin:20px 0;" />
          <p style="text-align:center;font-size:12px;">
            <a href="https://project-moonlander.vercel.app/planner" style="color:#00ffff;">Open Mission Planner →</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "Reminder scheduled",
      scheduledAt: reminderTime.toISOString(),
      scheduledBy: "immediate",
    });
  } catch (error) {
    console.error("Schedule reminder error:", error);
    return NextResponse.json({ error: "Failed to schedule" }, { status: 500 });
  }
}
