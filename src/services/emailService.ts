/**
 * JAYSOFTSHINE ERP - Resend Email Delivery Service
 * Uses Resend (smtp.resend.com / api.resend.com)
 * Organization: JaySoftShine (GSTIN: 08BKDPV7945P1Z2)
 */

export const RESEND_CONFIG = {
  host: 'smtp.resend.com',
  port: 465,
  user: 'resend',
  apiKey: 're_H5oTPCSP_NFHME4D7pwvm2jTGak4YjYoe',
  defaultFrom: 'JaySoftShine ERP <onboarding@resend.dev>',
  replyTo: 'jay@jaysoftshine.com',
  organisationName: 'JaySoftShine',
  gstin: '08BKDPV7945P1Z2',
};

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sandboxDeliveredTo?: string;
  intendedRecipient?: string;
  note?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  reply_to?: string;
  apiKey?: string;
}

/**
 * Dispatch an email via the Resend API endpoint
 */
export async function sendEmailViaResend(
  options: SendEmailOptions
): Promise<EmailDispatchResult> {
  const apiKey = options.apiKey || RESEND_CONFIG.apiKey;
  const from = options.from || RESEND_CONFIG.defaultFrom;
  const reply_to = options.reply_to || RESEND_CONFIG.replyTo;
  const toRecipients = Array.isArray(options.to) ? options.to : [options.to];

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        from,
        to: toRecipients,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // If error, return message
      return {
        success: false,
        error: data.message || data.error || 'Failed to dispatch email via Resend',
      };
    }

    return {
      success: true,
      messageId: data.id,
      sandboxDeliveredTo: data.sandboxDeliveredTo,
      intendedRecipient: data.intendedRecipient,
      note: data.note,
    };
  } catch (err: any) {
    // Client-side fallback: try direct fetch to Resend API
    try {
      const directRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: toRecipients,
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to,
        }),
      });

      const directData = await directRes.json();
      if (!directRes.ok) {
        return {
          success: false,
          error: directData.message || 'Resend API dispatch error',
        };
      }

      return {
        success: true,
        messageId: directData.id,
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        error: fallbackErr.message || err.message || 'Network error communicating with mail server',
      };
    }
  }
}

/**
 * Generates and dispatches a formal Welcome & Login Credentials email for newly added users
 */
export async function sendWelcomeUserEmail(params: {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
}): Promise<EmailDispatchResult> {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://jaysoftshine.com';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to JaySoftShine ERP</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <tr>
      <td style="background-color: #020617; padding: 28px; text-align: left;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <span style="display: inline-block; width: 36px; height: 36px; line-height: 36px; text-align: center; background: #ffffff; color: #020617; font-weight: 900; font-size: 16px; border-radius: 8px; margin-right: 12px;">JS</span>
              <span style="font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; vertical-align: middle;">JAYSOFTSHINE ERP</span>
            </td>
            <td style="text-align: right;">
              <span style="background: #1e293b; color: #94a3b8; font-size: 11px; font-family: monospace; padding: 4px 10px; border-radius: 6px; border: 1px solid #334155;">GST: 08BKDPV7945P1Z2</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px;">
          Welcome to JaySoftShine, ${params.name}!
        </h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-top: 0; margin-bottom: 20px;">
          Your enterprise user account has been successfully provisioned by the Administrator. You have been granted access to the JaySoftShine Audit & Operations ERP Console.
        </p>

        <!-- Credentials Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px 20px;">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                Your Access Credentials
              </div>
              <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px;">
                <tr>
                  <td width="35%" style="color: #64748b; font-weight: 600;">Portal URL:</td>
                  <td><a href="${currentOrigin}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${currentOrigin}</a></td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Login Email:</td>
                  <td style="font-family: monospace; font-weight: 700; color: #0f172a;">${params.email}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Temporary Password:</td>
                  <td style="font-family: monospace; font-weight: 700; color: #0f172a; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; display: inline-block;">${params.password}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Assigned Role:</td>
                  <td style="font-weight: 600; color: #0f172a;">${params.role}</td>
                </tr>
                ${
                  params.department
                    ? `<tr><td style="color: #64748b; font-weight: 600;">Department:</td><td style="color: #0f172a;">${params.department}</td></tr>`
                    : ''
                }
              </table>
            </td>
          </tr>
        </table>

        <!-- Security Warning -->
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
          <strong style="font-size: 12px; color: #991b1b; display: block; margin-bottom: 4px;">Important Security Protocol:</strong>
          <span style="font-size: 12px; color: #7f1d1d; line-height: 1.5;">
            Please sign in and change your password immediately upon first access. Do not share these credentials with anyone. All operations, manday approvals, and financial logs are linked to your profile in accordance with the Companies Act 2013 and IFC standards.
          </span>
        </div>

        <!-- Action Button -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding-bottom: 12px;">
              <a href="${currentOrigin}" style="background-color: #020617; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 8px; display: inline-block;">
                Sign In to JaySoftShine ERP &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.6;">
        JaySoftShine Audit & Operations ERP • Single Organization: JaySoftShine<br/>
        GSTIN: 08BKDPV7945P1Z2 • Support: <a href="mailto:jay@jaysoftshine.com" style="color: #64748b; text-decoration: underline;">jay@jaysoftshine.com</a><br/>
        This is an automated system notification dispatched via Resend.
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendEmailViaResend({
    to: params.email,
    subject: `Welcome to JaySoftShine ERP - Your Login Credentials (${params.name})`,
    html,
    text: `Welcome to JaySoftShine ERP!\n\nPortal: ${currentOrigin}\nLogin Email: ${params.email}\nTemporary Password: ${params.password}\nRole: ${params.role}\n\nPlease log in and update your password immediately.\nSupport: jay@jaysoftshine.com`,
  });
}

/**
 * Generates and dispatches a Password Reset email
 */
export async function sendPasswordResetEmail(params: {
  name: string;
  email: string;
  newPassword: string;
}): Promise<EmailDispatchResult> {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://jaysoftshine.com';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>JaySoftShine ERP - Password Reset</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="background-color: #020617; padding: 24px; text-align: left;">
        <span style="display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; background: #ffffff; color: #020617; font-weight: 900; font-size: 15px; border-radius: 6px; margin-right: 10px;">JS</span>
        <span style="font-size: 16px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; vertical-align: middle;">JAYSOFTSHINE ERP &bull; SECURITY</span>
      </td>
    </tr>

    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px;">
          Password Reset Request Completed
        </h2>
        <p style="font-size: 13px; color: #475569; line-height: 1.6; margin-top: 0; margin-bottom: 20px;">
          Hello ${params.name}, your account password has been reset. A new temporary password has been generated for your corporate account.
        </p>

        <!-- Password box -->
        <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin-bottom: 20px; text-align: center;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
            Your New Password
          </div>
          <div style="font-family: monospace; font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #020617; background: #ffffff; border: 1px dashed #94a3b8; padding: 8px 16px; border-radius: 6px; display: inline-block;">
            ${params.newPassword}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 8px;">
            Account Email: <strong style="color: #0f172a;">${params.email}</strong>
          </div>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
          For security reasons, we strongly recommend logging in and changing this temporary password in your Account Settings. If you did not initiate this request, contact your Super Admin immediately at <a href="mailto:jay@jaysoftshine.com" style="color: #0284c7;">jay@jaysoftshine.com</a>.
        </p>

        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <a href="${currentOrigin}" style="background-color: #020617; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: 700; font-size: 13px; border-radius: 8px; display: inline-block;">
                Sign In With New Password &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="background-color: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
        JaySoftShine ERP &bull; GSTIN: 08BKDPV7945P1Z2 &bull; Automated Security Dispatch via Resend
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendEmailViaResend({
    to: params.email,
    subject: `Password Reset Notification - JaySoftShine ERP (${params.email})`,
    html,
    text: `JaySoftShine ERP Password Reset\n\nYour new password is: ${params.newPassword}\nLogin: ${currentOrigin}\n\nIf you did not request this, contact jay@jaysoftshine.com immediately.`,
  });
}

/**
 * Sends a test email via Resend to verify configuration
 */
export async function sendTestEmail(toEmail: string): Promise<EmailDispatchResult> {
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px; background: #f8fafc; color: #0f172a;">
  <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
    <h2 style="color: #059669; margin-top: 0;">✓ Resend Integration Operational</h2>
    <p style="font-size: 14px; color: #334155;">
      This email confirms that the outgoing SMTP / API gateway with <strong>Resend (smtp.resend.com)</strong> is configured and working perfectly for <strong>JaySoftShine ERP</strong> (GSTIN: 08BKDPV7945P1Z2).
    </p>
    <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px;">
      Host: smtp.resend.com<br/>
      Port: 465 (SSL/TLS)<br/>
      Timestamp: ${new Date().toISOString()}
    </div>
  </div>
</body>
</html>
`;

  return sendEmailViaResend({
    to: toEmail,
    subject: `[Test] JaySoftShine ERP - Resend Mail Gateway Verified`,
    html,
    text: `Resend Mail Gateway Verified for JaySoftShine ERP (GSTIN: 08BKDPV7945P1Z2) at ${new Date().toISOString()}`,
  });
}
