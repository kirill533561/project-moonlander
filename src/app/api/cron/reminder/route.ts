import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const day = now.getDate();
  const dayOfWeek = now.getDay();

  const isFirstWeekend = day <= 7 && (dayOfWeek === 0 || dayOfWeek === 6);
  if (!isFirstWeekend) {
    return NextResponse.json({ message: "Not first weekend, skipping" });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const monthName = monthNames[now.getMonth()];

    await resend.emails.send({
      from: "Project Moonlander <onboarding@resend.dev>",
      to: process.env.REMINDER_EMAIL!,
      subject: `🚀 Mission Control: ${monthName} Report Due, Commander!`,
      html: `
        <div style="background:#0a0a1a;color:#e0e0e0;padding:32px;font-family:monospace;text-align:center;">
          <h1 style="color:#00ffff;font-size:24px;">🚀 PROJECT MOONLANDER</h1>
          <p style="font-size:18px;color:#ffd700;">INCOMING TRANSMISSION</p>
          <hr style="border-color:#2a2a4a;margin:24px 0;" />
          <p style="font-size:16px;">
            Commander, it's the first weekend of <strong style="color:#00ffff;">${monthName}</strong>.
          </p>
          <p style="font-size:16px;">
            Time to file your monthly mission report!
          </p>
          <p style="font-size:14px;color:#b967ff;margin-top:24px;">
            Log your finances, update your goals, and earn your badge.
          </p>
          <p style="margin-top:32px;font-size:12px;color:#666;">
            "The people who failed to plan are planning to fail..."
          </p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Reminder sent!" });
  } catch (error) {
    console.error("Failed to send reminder:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
