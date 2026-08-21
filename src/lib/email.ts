import nodemailer from 'nodemailer';

// SMTP Transporter configuration
// Supports Gmail App Passwords via GMAIL_USER and GMAIL_APP_PASSWORD, or custom SMTP
const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER || '';
const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      // Development fallback: jsonTransport for secure local simulation
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }
  return transporter;
}

export async function sendPasswordResetEmail(toEmail: string, otpCode: string): Promise<boolean> {
  try {
    const transport = getTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>رمز التحقق لاستعادة كلمة المرور</title>
        <style>
          body { font-family: 'Cairo', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; direction: rtl; text-align: right; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 12px; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .otp-card { background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #4338ca; margin: 0; }
          .notice { font-size: 12px; color: #64748b; line-height: 1.6; margin-bottom: 20px; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">سجل الطالب الإلكتروني 📚</h1>
            <p class="subtitle">منظومة المتابعة المدرسية الآمنة</p>
          </div>

          <p style="font-size: 14px; color: #1e293b; font-weight: bold;">أستاذنا الفاضل،</p>
          <p style="font-size: 13px; color: #334155; line-height: 1.6;">
            لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك المسجل بهذا البريد الإلكتروني. استخدم رمز التحقق السري التالي لإكمال العملية:
          </p>

          <div class="otp-card">
            <div class="otp-code">${otpCode}</div>
          </div>

          <p class="notice">
            ⏰ <strong>صلاحية الرمز:</strong> هذا الرمز صالح لمدة <strong>15 دقيقة</strong> فقط.<br>
            🔒 <strong>تنبيه أمان:</strong> لا تشارك هذا الرمز مع أي شخص. إذا لم تكن أنت من طلب استعادة كلمة المرور، يرجى تجاهل هذه الرسالة.
          </p>

          <div class="footer">
            تم إرسال هذا البريد تلقائياً من نظام سجل الطالب الإلكتروني المعتمد.<br>
            جميع الحقوق محفوظة © ${new Date().getFullYear()}
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: '"سجل الطالب الإلكتروني" <no-reply@studentnotes.school>',
      to: toEmail,
      subject: `رمز التحقق السري: ${otpCode} — سجل الطالب الإلكتروني`,
      text: `أستاذنا الفاضل، رمز التحقق الخاص بك هو: ${otpCode} (صالح لمدة 15 دقيقة).`,
      html: htmlContent,
    });

    console.log(`[Email Service] Sent verification OTP to ${toEmail} (MessageId: ${info.messageId || 'local'})`);
    return true;
  } catch (err) {
    console.error('[Email Service Error]:', err);
    return false;
  }
}
