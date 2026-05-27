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
    const buckets: Bucket[] = bucketRows?.[0]
      ? JSON.parse(bucketRows[0].value)
      : [];
    const plans: Plan[] = planRows?.[0]
      ? JSON.parse(planRows[0].value)
      : [];

    const now = new Date();
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const activeTasks = tasks.filter((t) => t.progress !== "completed");

    const overdue = activeTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now
    );

    const dueSoon = activeTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) >= now &&
        new Date(t.dueDate) <= in1h
    );

    const dueToday = activeTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) >= in1h &&
        new Date(t.dueDate) <= in24h
    );

    if (overdue.length === 0 && dueSoon.length === 0 && dueToday.length === 0) {
      return NextResponse.json({ message: "No reminders needed" });
    }

    const getBucket = (id: string) =>
      buckets.find((b) => b.id === id)?.name || "Unknown";
    const getPlan = (id: string) =>
      plans.find((p) => p.id === id)?.name || "Mission Plan";

    const priorityEmoji: Record<string, string> = {
      urgent: "🔴",
      important: "🟡",
      medium: "🔵",
      low: "⚪",
    };

    const formatTask = (t: Task) => {
      const due = t.dueDate ? new Date(t.dueDate) : null;
      const dateStr = due
        ? due.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      const checkDone = t.checklist.filter((c) => c.done).length;
      const checkTotal = t.checklist.length;
      const checkStr =
        checkTotal > 0 ? ` [${checkDone}/${checkTotal} checklist]` : "";
      return `${priorityEmoji[t.priority] || "⚪"} <strong>${t.title}</strong><br/>
        <span style="color:#888;font-size:12px;">${getPlan(t.planId)} → ${getBucket(t.bucketId)} · Due: ${dateStr}${checkStr}</span>`;
    };

    const sections: string[] = [];

    if (dueSoon.length > 0) {
      sections.push(`
        <div style="margin-bottom:20px;">
          <h2 style="color:#ff4444;font-size:16px;">⚡ DUE WITHIN 1 HOUR</h2>
          ${dueSoon.map((t) => `<p style="margin:8px 0;padding:8px;border-left:3px solid #ff4444;">${formatTask(t)}</p>`).join("")}
        </div>
      `);
    }

    if (overdue.length > 0) {
      sections.push(`
        <div style="margin-bottom:20px;">
          <h2 style="color:#ffd700;font-size:16px;">⚠️ OVERDUE</h2>
          ${overdue.map((t) => `<p style="margin:8px 0;padding:8px;border-left:3px solid #ffd700;">${formatTask(t)}</p>`).join("")}
        </div>
      `);
    }

    if (dueToday.length > 0) {
      sections.push(`
        <div style="margin-bottom:20px;">
          <h2 style="color:#00ffff;font-size:16px;">📅 DUE WITHIN 24 HOURS</h2>
          ${dueToday.map((t) => `<p style="margin:8px 0;padding:8px;border-left:3px solid #00ffff;">${formatTask(t)}</p>`).join("")}
        </div>
      `);
    }

    const totalUrgent = overdue.length + dueSoon.length;
    const subject =
      dueSoon.length > 0
        ? `⚡ ${dueSoon.length} task${dueSoon.length > 1 ? "s" : ""} due NOW!`
        : overdue.length > 0
          ? `⚠️ ${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}`
          : `📅 ${dueToday.length} task${dueToday.length > 1 ? "s" : ""} due today`;

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Project Moonlander <onboarding@resend.dev>",
      to: process.env.REMINDER_EMAIL!,
      subject: `🚀 Mission Planner: ${subject}`,
      html: `
        <div style="background:#0a0a1a;color:#e0e0e0;padding:32px;font-family:monospace;">
          <h1 style="color:#00ffff;font-size:20px;text-align:center;">📋 MISSION PLANNER ALERT</h1>
          <hr style="border-color:#2a2a4a;margin:20px 0;" />
          ${sections.join("")}
          <hr style="border-color:#2a2a4a;margin:20px 0;" />
          <p style="text-align:center;font-size:12px;color:#666;">
            <a href="https://project-moonlander.vercel.app/planner" style="color:#00ffff;">Open Mission Planner →</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "Reminders sent",
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      dueToday: dueToday.length,
    });
  } catch (error) {
    console.error("Planner reminder error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
