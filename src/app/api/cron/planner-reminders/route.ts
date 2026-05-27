import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface Task {
  id: string;
  bucketId: string;
  planId: string;
  title: string;
  priority: string;
  progress: string;
  dueDate: string | null;
  checklist: { id: string; text: string; done: boolean }[];
}

interface Bucket {
  id: string;
  planId: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: taskRows } = await supabase
      .from("user_data")
      .select("value")
      .eq("key", "ml-planner-tasks");

    const { data: bucketRows } = await supabase
      .from("user_data")
      .select("value")
      .eq("key", "ml-planner-buckets");

    const { data: planRows } = await supabase
      .from("user_data")
      .select("value")
      .eq("key", "ml-planner-plans");

    if (!taskRows?.length) {
      return NextResponse.json({ message: "No planner data found" });
    }

    const tasks: Task[] = JSON.parse(taskRows[0].value);
    const buckets: Bucket[] = bucketRows?.[0] ? JSON.parse(bucketRows[0].value) : [];
    const plans: Plan[] = planRows?.[0] ? JSON.parse(planRows[0].value) : [];

    const now = new Date();
    const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const activeTasks = tasks.filter((t) => t.progress !== "completed" && t.dueDate);

    const getBucket = (id: string) => buckets.find((b) => b.id === id)?.name || "Unknown";
    const getPlan = (id: string) => plans.find((p) => p.id === id)?.name || "Mission Plan";

    const priorityEmoji: Record<string, string> = {
      urgent: "🔴", important: "🟡", medium: "🔵", low: "⚪",
    };

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // ── 1. Schedule precise 15-min-before emails for tasks due within 72h ──
    const needsScheduling = activeTasks.filter((t) => {
      const due = new Date(t.dueDate!);
      const reminder = new Date(due.getTime() - 15 * 60 * 1000);
      return reminder > now && due <= in72h;
    });

    let scheduled = 0;
    for (const t of needsScheduling) {
      const due = new Date(t.dueDate!);
      const reminderTime = new Date(due.getTime() - 15 * 60 * 1000);
      const dueStr = due.toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

      try {
        await resend.emails.send({
          from: "Project Moonlander <onboarding@resend.dev>",
          to: process.env.REMINDER_EMAIL!,
          subject: `⏰ Task due in 15 min: ${t.title}`,
          scheduledAt: reminderTime.toISOString(),
          html: `
            <div style="background:#0a0a1a;color:#e0e0e0;padding:32px;font-family:monospace;">
              <h1 style="color:#00ffff;font-size:20px;text-align:center;">⏰ DEADLINE APPROACHING</h1>
              <hr style="border-color:#2a2a4a;margin:20px 0;" />
              <div style="padding:16px;border-left:3px solid #ff4444;margin:12px 0;">
                <p style="font-size:18px;margin:0 0 8px;">
                  ${priorityEmoji[t.priority] || "🔵"} <strong>${t.title}</strong>
                </p>
                <p style="color:#888;font-size:13px;margin:0;">
                  ${getPlan(t.planId)} → ${getBucket(t.bucketId)}<br/>
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
        scheduled++;
      } catch (e) {
        console.error(`Failed to schedule reminder for "${t.title}":`, e);
      }
    }

    // ── 2. Morning summary: overdue + due today ──
    const overdue = activeTasks.filter(
      (t) => new Date(t.dueDate!) < now
    );
    const dueToday = activeTasks.filter((t) => {
      const due = new Date(t.dueDate!);
      return due >= now && due <= in24h;
    });

    if (overdue.length === 0 && dueToday.length === 0 && scheduled === 0) {
      return NextResponse.json({ message: "No reminders needed" });
    }

    if (overdue.length > 0 || dueToday.length > 0) {
      const formatTask = (t: Task) => {
        const due = new Date(t.dueDate!);
        const dateStr = due.toLocaleDateString("en-US", {
          weekday: "short", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        });
        return `${priorityEmoji[t.priority] || "⚪"} <strong>${t.title}</strong><br/>
          <span style="color:#888;font-size:12px;">${getPlan(t.planId)} → ${getBucket(t.bucketId)} · Due: ${dateStr}</span>`;
      };

      const sections: string[] = [];
      if (overdue.length > 0) {
        sections.push(`
          <div style="margin-bottom:20px;">
            <h2 style="color:#ffd700;font-size:16px;">⚠️ OVERDUE (${overdue.length})</h2>
            ${overdue.map((t) => `<p style="margin:8px 0;padding:8px;border-left:3px solid #ffd700;">${formatTask(t)}</p>`).join("")}
          </div>
        `);
      }
      if (dueToday.length > 0) {
        sections.push(`
          <div style="margin-bottom:20px;">
            <h2 style="color:#00ffff;font-size:16px;">📅 DUE TODAY (${dueToday.length})</h2>
            ${dueToday.map((t) => `<p style="margin:8px 0;padding:8px;border-left:3px solid #00ffff;">${formatTask(t)}</p>`).join("")}
          </div>
        `);
      }

      await resend.emails.send({
        from: "Project Moonlander <onboarding@resend.dev>",
        to: process.env.REMINDER_EMAIL!,
        subject: `🚀 Morning brief: ${overdue.length} overdue, ${dueToday.length} due today`,
        html: `
          <div style="background:#0a0a1a;color:#e0e0e0;padding:32px;font-family:monospace;">
            <h1 style="color:#00ffff;font-size:20px;text-align:center;">📋 DAILY MISSION BRIEF</h1>
            <hr style="border-color:#2a2a4a;margin:20px 0;" />
            ${sections.join("")}
            <hr style="border-color:#2a2a4a;margin:20px 0;" />
            <p style="text-align:center;font-size:12px;">
              <a href="https://project-moonlander.vercel.app/planner" style="color:#00ffff;">Open Mission Planner →</a>
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      message: "Done",
      scheduled,
      overdue: overdue.length,
      dueToday: dueToday.length,
    });
  } catch (error) {
    console.error("Planner reminder error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
