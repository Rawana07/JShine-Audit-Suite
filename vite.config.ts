import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function resendEmailPlugin(): Plugin {
  return {
    name: 'resend-email-server',
    configureServer(server) {
      server.middlewares.use('/api/send-email', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const apiKey =
              payload.apiKey ||
              process.env.RESEND_API_KEY ||
              're_H5oTPCSP_NFHME4D7pwvm2jTGak4YjYoe';

            const toRecipients = Array.isArray(payload.to) ? payload.to : [payload.to];
            const senderFrom = payload.from || 'JaySoftShine ERP <onboarding@resend.dev>';

            // Primary send attempt
            let resendRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: senderFrom,
                to: toRecipients,
                subject: payload.subject,
                html: payload.html,
                text: payload.text,
                reply_to: payload.reply_to || 'jay@jaysoftshine.com',
              }),
            });

            let resData = await resendRes.json();

            // Handle Resend unverified test domain restriction gracefully
            if (!resendRes.ok && resData?.name === 'validation_error' && resData.message?.includes('primerawana07@gmail.com')) {
              // Dispatch to the verified account owner mailbox so real delivery occurs
              const fallbackNotice = `<div style="padding:10px;margin-bottom:15px;background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;font-family:sans-serif;font-size:12px;color:#92400e;">
                <strong>Resend Sandbox Delivery Notice:</strong> Intended Recipient: <code>${toRecipients.join(', ')}</code>.<br/>
                Delivered to verified Resend account owner (<code>primerawana07@gmail.com</code>). Verify domain at resend.com/domains for external recipients.
              </div>`;

              const fallbackRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: senderFrom,
                  to: ['primerawana07@gmail.com'],
                  subject: `[For: ${toRecipients.join(', ')}] ${payload.subject}`,
                  html: fallbackNotice + (payload.html || payload.text),
                  reply_to: payload.reply_to || 'jay@jaysoftshine.com',
                }),
              });
              const fallbackData = await fallbackRes.json();
              if (fallbackRes.ok) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    ...fallbackData,
                    sandboxDeliveredTo: 'primerawana07@gmail.com',
                    intendedRecipient: toRecipients.join(', '),
                    note: 'Delivered via Resend to account owner primerawana07@gmail.com.',
                  })
                );
                return;
              }
            }

            res.statusCode = resendRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(resData));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Failed to dispatch email' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), resendEmailPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
