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

const ADMIN_SUPPORT_EMAIL = 'moomihamed028@gmail.com';

export async function sendSupportTicketEmailToAdmin(ticket: {
  ticketNumber: string;
  teacherName: string;
  teacherEmail: string;
  category: string;
  subject: string;
  description: string;
  attachmentUrl?: string | null;
  createdAt: string;
}): Promise<boolean> {
  try {
    const transport = getTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تذكرة دعم فني جديدة</title>
        <style>
          body { font-family: 'Cairo', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; direction: rtl; text-align: right; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 12px; }
          .badge { display: inline-block; padding: 4px 12px; background: #e0e7ff; color: #4338ca; border-radius: 999px; font-size: 12px; font-weight: 800; }
          .table-info { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table-info td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .table-info td.label { font-weight: bold; color: #64748b; width: 35%; }
          .table-info td.val { font-weight: 900; color: #1e293b; }
          .desc-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; margin: 16px 0; font-size: 13px; line-height: 1.6; color: #334155; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">🛟 تذكرة دعم فني جديدة</span>
            <h1 class="title">سجل الطالب الإلكتروني</h1>
          </div>

          <table class="table-info">
            <tr>
              <td class="label">رقم التذكرة:</td>
              <td class="val">${ticket.ticketNumber}</td>
            </tr>
            <tr>
              <td class="label">اسم المعلم:</td>
              <td class="val">${ticket.teacherName}</td>
            </tr>
            <tr>
              <td class="label">بريد المعلم:</td>
              <td class="val">${ticket.teacherEmail}</td>
            </tr>
            <tr>
              <td class="label">نوع المشكلة:</td>
              <td class="val">${ticket.category}</td>
            </tr>
            <tr>
              <td class="label">عنوان المشكلة:</td>
              <td class="val">${ticket.subject}</td>
            </tr>
            <tr>
              <td class="label">تاريخ ووقت الإرسال:</td>
              <td class="val">${ticket.createdAt}</td>
            </tr>
          </table>

          <div style="font-weight: bold; font-size: 13px; color: #475569; margin-top: 16px;">وصف المشكلة من المعلم:</div>
          <div class="desc-box">
            ${ticket.description.replace(/\n/g, '<br>')}
          </div>

          ${ticket.attachmentUrl ? `
            <div style="margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 12px; font-size: 12px;">
              📷 <strong>مرفق لقطة الشاشة:</strong> تم إرفاق صورة مع التذكرة.
            </div>
          ` : ''}

          <div class="footer">
            تم إرسال هذا الإشعار تلقائياً إلى إدارة منصة سجل الطالب الإلكتروني.<br>
            يمكنك الرد ومتابعة التذكرة من خلال لوحة تحكم المالك (Owner Dashboard).
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: '"سجل الطالب الإلكتروني" <support@studentnotes.school>',
      to: ADMIN_SUPPORT_EMAIL,
      subject: `[تذكرة دعم ${ticket.ticketNumber}] ${ticket.subject} — من: ${ticket.teacherName}`,
      text: `تذكرة جديدة: ${ticket.ticketNumber}\nالمعلم: ${ticket.teacherName} (${ticket.teacherEmail})\nالنوع: ${ticket.category}\nالعنوان: ${ticket.subject}\nالوصف: ${ticket.description}`,
      html: htmlContent,
    });

    console.log(`[Email Service] Sent Support Ticket ${ticket.ticketNumber} to Admin Support (MessageId: ${info.messageId || 'local'})`);
    return true;
  } catch (err) {
    console.error('[Email Service Support Error]:', err);
    return false;
  }
}

export async function sendSupportTicketStatusUpdateEmail(ticket: {
  ticketNumber: string;
  teacherName: string;
  teacherEmail: string;
  statusLabel: string;
  adminReply?: string | null;
}): Promise<boolean> {
  try {
    const transport = getTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تحديث حالة تذكرة الدعم الفني</title>
        <style>
          body { font-family: 'Cairo', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; direction: rtl; text-align: right; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 12px; }
          .status-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 16px; padding: 16px; text-align: center; margin: 20px 0; font-size: 16px; font-weight: 900; color: #166534; }
          .reply-box { background: #f8fafc; border-right: 4px solid #4f46e5; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px; line-height: 1.6; color: #334155; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">سجل الطالب الإلكتروني 📚</h1>
            <p style="font-size: 13px; color: #64748b;">تحديث بخصوص تذكرة الدعم الفني الخاصة بك</p>
          </div>

          <p style="font-size: 14px; color: #1e293b; font-weight: bold;">أستاذنا الفاضل ${ticket.teacherName}،</p>
          <p style="font-size: 13px; color: #334155; line-height: 1.6;">
            تم تحديث حالة تذكرتك رقم <strong>${ticket.ticketNumber}</strong> إلى:
          </p>

          <div class="status-box">
            الحالة الحالية: ${ticket.statusLabel}
          </div>

          ${ticket.adminReply ? `
            <div style="font-weight: bold; font-size: 13px; color: #475569; margin-top: 16px;">رد إدارة المنصة:</div>
            <div class="reply-box">
              ${ticket.adminReply.replace(/\n/g, '<br>')}
            </div>
          ` : ''}

          <p style="font-size: 12px; color: #64748b; line-height: 1.6;">
            نحن هنا لمساعدتك دائماً 🤝 يمكنك متابعة كافة تذاكرك وتفاصيلها من خلال قسم <strong>الدعم الفني</strong> داخل حسابك.
          </p>

          <div class="footer">
            تم إرسال هذا البريد تلقائياً من نظام الدعم الفني لسجل الطالب الإلكتروني.
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: '"الدعم الفني - سجل الطالب الإلكتروني" <support@studentnotes.school>',
      to: ticket.teacherEmail,
      subject: `[تحديث التذكرة ${ticket.ticketNumber}] حالة التذكرة: ${ticket.statusLabel}`,
      text: `أستاذنا ${ticket.teacherName}، تم تحديث حالة تذكرتك ${ticket.ticketNumber} إلى: ${ticket.statusLabel}`,
      html: htmlContent,
    });

    console.log(`[Email Service] Sent Ticket Status Update to ${ticket.teacherEmail} (MessageId: ${info.messageId || 'local'})`);
    return true;
  } catch (err) {
    console.error('[Email Service Status Update Error]:', err);
    return false;
  }
}
