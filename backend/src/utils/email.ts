import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import logger from './logger'
import { settingsService } from '@modules/settings/settings.service'
import { buildActivationUrls, generateInvoicePdfBuffer } from './invoicePdf'

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface SmtpConfig {
  smtpHost: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser: string
  smtpPassword: string
  smtpFromEmail?: string
  smtpFromName?: string
}

const S = {
  outerBg:       '#f1f5f9',
  cardBg:        '#ffffff',
  green:         '#43A1F0',
  greenMed:      '#2a7dd4',
  greenLight:    '#1f5ea8',
  greenLightBg:  '#f0f7fe',
  greenBorder:   '#c1e1f9',
  textPrimary:   '#0f172a',
  textSecondary: '#334155',
  textMuted:     '#64748b',
  textFaint:     '#94a3b8',
  border:        '#e2e8f0',
  footerBg:      '#f8fafc',
  androidGreen:  '#34a853',
  iosBlack:      '#0f172a',
}

const year = () => new Date().getFullYear()

const wrapEmail = (content: string): string => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>Velox eSIM</title>
</head>
<body style="margin:0;padding:0;background-color:${S.outerBg};font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${S.outerBg};min-width:100%;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:${S.cardBg};border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,79,59,0.12);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,${S.green} 0%,${S.greenMed} 100%);padding:36px 40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 28px;margin-bottom:10px;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;font-family:Arial,Helvetica,sans-serif;">Velox eSIM</span>
            </div>
            <br>
            <span style="color:rgba(255,255,255,0.7);font-size:13px;font-family:Arial,Helvetica,sans-serif;">Global eSIM, Instant Connectivity</span>
          </td>
        </tr>

        <!-- CONTENT -->
        <tr>
          <td style="padding:40px 40px 32px;background:${S.cardBg};">
            ${content}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:${S.footerBg};border-top:1px solid ${S.border};padding:24px 40px;text-align:center;">
            <p style="color:${S.textMuted};font-size:12px;margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;">© ${year()} Velox eSIM. All rights reserved.</p>
            <p style="color:${S.textFaint};font-size:11px;margin:0;font-family:Arial,Helvetica,sans-serif;">This is an automated email, please do not reply directly.</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`

const divider = () =>
  `<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;"><tr><td style="border-top:1px solid ${S.border};font-size:0;line-height:0;">&nbsp;</td></tr></table>`

const infoRow = (label: string, value: string, last = false) =>
  `<tr>
    <td style="padding:11px 0;${last ? '' : `border-bottom:1px solid ${S.border};`}color:${S.textMuted};font-size:13px;font-family:Arial,Helvetica,sans-serif;width:45%;">${label}</td>
    <td style="padding:11px 0;${last ? '' : `border-bottom:1px solid ${S.border};`}color:${S.textPrimary};font-size:13px;font-weight:600;text-align:right;font-family:Arial,Helvetica,sans-serif;">${value}</td>
  </tr>`

const stepList = (steps: string[]) =>
  steps.map((step, i) => `
  <tr>
    <td style="vertical-align:top;padding:6px 0;">
      <table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td style="vertical-align:top;padding-right:12px;">
          <span style="display:inline-block;background:${S.green};color:#ffffff;width:22px;height:22px;border-radius:50%;text-align:center;font-size:11px;font-weight:700;line-height:22px;font-family:Arial,Helvetica,sans-serif;">${i + 1}</span>
        </td>
        <td style="vertical-align:middle;color:${S.textSecondary};font-size:14px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;padding-top:2px;">${step}</td>
      </tr></table>
    </td>
  </tr>`).join('')

class EmailService {
  private templates: Map<string, EmailTemplate> = new Map()
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeTemplates()
    this.initializeTransporter()
  }

  private async initializeTransporter(): Promise<void> {
    try {
      const settings = await settingsService.getSettings()

      if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
        logger.warn('[EmailService] SMTP settings not configured. Email sending will fail.')
        return
      }

      this.transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        secure: settings.smtpSecure || true,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPassword,
        },
      })

      logger.info('[EmailService] SMTP transporter initialized successfully')
    } catch (error) {
      logger.error('[EmailService] Failed to initialize SMTP transporter', error instanceof Error ? error : new Error(String(error)))
    }
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporter) {
      await this.initializeTransporter()
    }
    if (!this.transporter) {
      throw new Error('SMTP transporter not initialized. Check SMTP settings.')
    }
    return this.transporter
  }

  private initializeTemplates(): void {
    this.templates.set('order-confirmation', {
      subject: 'Order Confirmed ✓ — Velox eSIM',
      html: wrapEmail(`
        <h2 style="color:${S.textPrimary};font-size:22px;font-weight:700;margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;">Order Confirmed!</h2>
        <p style="color:${S.textSecondary};margin:0 0 24px;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
          Thank you for your purchase. Your payment has been processed and your order is confirmed.
        </p>
        <span style="display:inline-block;background:${S.greenLightBg};color:${S.green};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">✓ Order Confirmed</span>
        ${divider()}
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
          ${infoRow('Order ID', '{{orderId}}')}
          ${infoRow('Total Amount', '{{total}}')}
          ${infoRow('Status', '{{status}}', true)}
        </table>
        {{invoiceSection}}
        <p style="color:${S.textMuted};font-size:13px;margin:20px 0 0;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
          Your invoice PDF is attached and also available in the <strong>Billing</strong> section of your dashboard.
        </p>
      `),
      text: `Order Confirmed!\n\nOrder ID: {{orderId}}\nTotal: {{total}}\nStatus: {{status}}\n{{invoiceSection}}`,
    })
    this.templates.set('esim-activated', {
      subject: 'Your eSIM is Ready — Velox eSIM',
      html: wrapEmail(`
        <h2 style="color:${S.textPrimary};font-size:22px;font-weight:700;margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;">Your eSIM is Ready!</h2>
        <p style="color:${S.textSecondary};margin:0 0 24px;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
          Your eSIM has been provisioned and is ready to activate. Use the one-click links or scan the QR code below.
        </p>

        <!-- Activation code box -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
          <tr>
            <td style="background:${S.greenLightBg};border:1px solid ${S.greenBorder};border-radius:10px;padding:20px 24px;">
              <p style="color:${S.textMuted};font-size:11px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif;">eSIM Activation Code</p>
              <p style="color:${S.green};font-size:17px;font-weight:700;margin:0;font-family:Courier New,Courier,monospace;letter-spacing:1px;word-break:break-all;">{{esimCode}}</p>
            </td>
          </tr>
        </table>

        {{activationLinksSection}}

        ${divider()}

        <h3 style="color:${S.textPrimary};font-size:15px;font-weight:700;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;">How to activate manually:</h3>
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
          ${stepList([
            'Go to <strong>Settings → Mobile / Cellular</strong>',
            'Select <strong>"Add eSIM"</strong> or <strong>"Add Data Plan"</strong>',
            'Choose <strong>"Use QR Code"</strong> or enter details manually',
            'Enter the activation code shown above',
            'Follow the on-screen instructions to complete setup',
          ])}
        </table>

        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:20px;">
          <tr>
            <td style="background:#fffbeb;border-left:4px solid #d97706;border-radius:0 8px 8px 0;padding:14px 18px;">
              <p style="color:#92400e;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
                <strong>Important:</strong> The activation code can only be used once. Keep this email safe.
              </p>
            </td>
          </tr>
        </table>
      `),
      text: `Your eSIM is Ready!\n\nActivation Code: {{esimCode}}\n\nAndroid: {{androidUrl}}\niPhone: {{iosUrl}}\n\n1. Go to Settings → Mobile/Cellular\n2. Select "Add eSIM"\n3. Enter or scan your activation code\n4. Follow on-screen instructions`,
    })
    this.templates.set('payment-receipt', {
      subject: 'Payment Receipt — Velox eSIM',
      html: wrapEmail(`
        <h2 style="color:${S.textPrimary};font-size:22px;font-weight:700;margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;">Payment Received</h2>
        <p style="color:${S.textSecondary};margin:0 0 24px;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
          Thank you! Your payment has been successfully processed.
        </p>
        <span style="display:inline-block;background:${S.greenLightBg};color:${S.green};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">✓ Payment Successful</span>
        ${divider()}
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
          ${infoRow('Transaction ID', '{{transactionId}}')}
          ${infoRow('Amount Paid', '{{amount}}')}
          ${infoRow('Date', '{{date}}')}
          ${infoRow('Status', '{{status}}', true)}
        </table>
      `),
      text: `Payment Received\n\nTransaction ID: {{transactionId}}\nAmount: {{amount}}\nDate: {{date}}\nStatus: {{status}}`,
    })
    this.templates.set('invoice', {
      subject: 'Your eSIM is Ready — Velox eSIM',
      html: wrapEmail(`
        <h2 style="color:${S.textPrimary};font-size:22px;font-weight:700;margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;">Your eSIM is Ready to Activate!</h2>
        <p style="color:${S.textSecondary};margin:0 0 24px;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
          Your purchase is complete. Use the one-click button for your device or scan the QR code below to activate your eSIM instantly.
        </p>

        {{activationSection}}

        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;">
          <tr>
            <td style="background:${S.footerBg};border:1px solid ${S.border};border-radius:10px;padding:16px 20px;">
              <p style="color:${S.textMuted};font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
                📄 Your invoice <strong>{{invoiceNumber}}</strong> is attached as a PDF. You can also download it anytime from your dashboard.
              </p>
            </td>
          </tr>
        </table>
      `),
      text: `Your eSIM is Ready!\n\nInvoice: {{invoiceNumber}}\n\nActivate instantly:\nAndroid: see attached PDF or your email\niPhone: see attached PDF or your email\n\nYour invoice PDF is attached.`,
    })
    this.templates.set('ticket-response', {
      subject: 'Support Update: {{subject}} — Velox eSIM',
      html: wrapEmail(`
        <h2 style="color:${S.textPrimary};font-size:22px;font-weight:700;margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;">Support Ticket Update</h2>
        <p style="color:${S.textSecondary};margin:0 0 24px;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
          A new response has been added to your support ticket.
        </p>
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
          ${infoRow('Ticket ID', '{{ticketId}}')}
          ${infoRow('Subject', '{{subject}}')}
          ${infoRow('Priority', '{{priority}}', true)}
        </table>
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
          <tr>
            <td style="background:${S.greenLightBg};border-left:4px solid ${S.green};border-radius:0 8px 8px 0;padding:16px 20px;">
              <p style="color:${S.textMuted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;">Response</p>
              <p style="color:${S.textPrimary};font-size:14px;line-height:1.6;margin:0;font-family:Arial,Helvetica,sans-serif;">{{response}}</p>
            </td>
          </tr>
        </table>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="border-radius:8px;background:${S.green};">
              <a href="{{ticketLink}}" style="display:inline-block;background:${S.green};color:#ffffff;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">View Ticket →</a>
            </td>
          </tr>
        </table>
      `),
      text: `Support Ticket Update\n\nTicket ID: {{ticketId}}\nSubject: {{subject}}\nPriority: {{priority}}\n\nResponse:\n{{response}}\n\nView ticket: {{ticketLink}}`,
    })
    this.templates.set('welcome', {
      subject: 'Welcome to Velox eSIM — Get Started!',
      html: wrapEmail(`
        <h2 style="color:${S.textPrimary};font-size:24px;font-weight:700;margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;">Welcome, {{name}}! 🌍</h2>
        <p style="color:${S.textSecondary};margin:0 0 28px;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
          We're thrilled to have you on board. With Velox eSIM you can get connected in 190+ countries instantly — no physical SIM needed.
        </p>
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
          ${[
            ['Browse Plans', 'Explore eSIM data plans for your destination.'],
            ['Buy Instantly', 'Complete checkout in seconds — no waiting.'],
            ['Activate & Go', 'One-click activation or scan the QR code.'],
            ['Stay Connected', 'Manage all your eSIMs from your dashboard.'],
          ].map(([title, desc], i) => `
          <tr>
            <td style="padding:10px 0;${i < 3 ? `border-bottom:1px solid ${S.border};` : ''}">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr>
                <td style="vertical-align:top;padding-right:14px;padding-top:2px;">
                  <span style="display:inline-block;background:${S.green};color:#ffffff;width:26px;height:26px;border-radius:50%;text-align:center;font-size:12px;font-weight:700;line-height:26px;font-family:Arial,Helvetica,sans-serif;">${i + 1}</span>
                </td>
                <td style="vertical-align:middle;">
                  <p style="color:${S.textPrimary};font-size:14px;font-weight:700;margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;">${title}</p>
                  <p style="color:${S.textMuted};font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">${desc}</p>
                </td>
              </tr></table>
            </td>
          </tr>`).join('')}
        </table>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="border-radius:8px;background:${S.green};">
              <a href="{{dashboardLink}}" style="display:inline-block;background:${S.green};color:#ffffff;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">Go to Dashboard →</a>
            </td>
          </tr>
        </table>
      `),
      text: `Welcome to Velox eSIM!\n\nHi {{name}},\n\n1. Browse plans\n2. Buy instantly\n3. Activate & go\n4. Stay connected\n\nDashboard: {{dashboardLink}}`,
    })
    this.templates.set('password-reset', {
      subject: 'Reset Your Password — Velox eSIM',
      html: wrapEmail(`
        <h2 style="color:${S.textPrimary};font-size:22px;font-weight:700;margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;">Reset Your Password</h2>
        <p style="color:${S.textSecondary};margin:0 0 24px;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
          We received a request to reset the password for your account. Click the button below to choose a new password.
        </p>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
          <tr>
            <td style="border-radius:8px;background:${S.green};">
              <a href="{{resetLink}}" style="display:inline-block;background:${S.green};color:#ffffff;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">Reset Password →</a>
            </td>
          </tr>
        </table>
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="background:#fffbeb;border-left:4px solid #d97706;border-radius:0 8px 8px 0;padding:14px 18px;">
              <p style="color:#92400e;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
                This link expires in <strong>24 hours</strong>. If you didn't request a reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      `),
      text: `Reset Your Password\n\nReset link: {{resetLink}}\n\nThis link expires in 24 hours.`,
    })
    this.templates.set('password-changed', {
      subject: 'Your Password Has Been Changed — Velox eSIM',
      html: wrapEmail(`
        <h2 style="color:${S.textPrimary};font-size:22px;font-weight:700;margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;">Password Changed Successfully</h2>
        <p style="color:${S.textSecondary};margin:0 0 24px;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
          Your account password has been successfully updated. If you didn't make this change, please contact our support team immediately.
        </p>
        <span style="display:inline-block;background:${S.greenLightBg};color:${S.green};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">✓ Security Updated</span>
        ${divider()}
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="background:#fffbeb;border-left:4px solid #d97706;border-radius:0 8px 8px 0;padding:14px 18px;">
              <p style="color:#92400e;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
                <strong>Suspicious activity?</strong> If you didn't change your password, <a href="{{supportLink}}" style="color:#d97706;font-weight:700;text-decoration:none;">contact support immediately</a>.
              </p>
            </td>
          </tr>
        </table>
      `),
      text: `Your password has been successfully changed.\n\nIf you didn't make this change, contact support: {{supportLink}}`,
    })
  }

  async sendEmail(
    to: string | string[],
    smtpConfigOrSubject: SmtpConfig | string,
    htmlOrSubject?: string,
    textContent?: string,
    attachments?: nodemailer.SendMailOptions['attachments']
  ): Promise<boolean> {
    try {
      let transporter: nodemailer.Transporter
      let subject: string
      let htmlContent: string
      let text: string | undefined
      const settings = await settingsService.getSettings()

      if (typeof smtpConfigOrSubject === 'string') {
        transporter = await this.getTransporter()
        subject = smtpConfigOrSubject
        htmlContent = htmlOrSubject || ''
        text = textContent
      } else {
        const smtpConfig = smtpConfigOrSubject as SmtpConfig
        transporter = nodemailer.createTransport({
          host: smtpConfig.smtpHost,
          port: smtpConfig.smtpPort || 587,
          secure: smtpConfig.smtpSecure || true,
          auth: { user: smtpConfig.smtpUser, pass: smtpConfig.smtpPassword },
        })
        subject = htmlOrSubject || 'Test Email'
        htmlContent = textContent || 'SMTP connection test successful'
        text = textContent
      }

      const from = `${settings.smtpFromName} <${settings.smtpFromEmail}>`

      const info = await transporter.sendMail({
        from,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: htmlContent,
        text: text || htmlContent.replace(/<[^>]*>/g, ''),
        attachments,
      })

      logger.info(`[EmailService] Email sent to ${to}`, { messageId: info.messageId })
      return true
    } catch (error) {
      logger.error('[EmailService] Error sending email', error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  async sendTemplateEmail(
    to: string | string[],
    templateName: string,
    data: Record<string, unknown>,
    attachments?: nodemailer.SendMailOptions['attachments']
  ): Promise<void> {
    const template = this.templates.get(templateName)
    if (!template) {
      throw new Error(`Email template "${templateName}" not found`)
    }

    let html = template.html
    let text = template.text
    let subject = template.subject
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      const val = String(value)
      html = html.replace(regex, () => val)
      text = text.replace(regex, () => val)
      subject = subject.replace(regex, () => val)
    })

    const result = await this.sendEmail(to, subject, html, text, attachments)
    if (!result) {
      throw new Error(`Failed to send template email: ${templateName}`)
    }
  }

  async sendOrderConfirmation(
    email: string,
    orderId: string,
    total: number,
    status: string,
    invoiceNumber?: string,
  ): Promise<void> {
    await this.sendTemplateEmail(email, 'order-confirmation', {
      orderId,
      total: `$${total.toFixed(2)}`,
      status,
      invoiceSection: invoiceNumber
        ? `<p style="color:${S.textMuted};font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">Invoice: <strong style="color:${S.textPrimary};">${invoiceNumber}</strong></p>`
        : '',
    })
  }

  async sendeSIMActivation(email: string, esimCode: string): Promise<void> {
    const urls = buildActivationUrls(esimCode)

    const activationLinksSection = `
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
        <tr>
          <td style="background:${S.greenLightBg};border:1px solid ${S.greenBorder};border-radius:12px;padding:24px;">
            <p style="color:${S.green};font-size:15px;font-weight:700;margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;">⚡ One-Click Activation</p>
            <p style="color:${S.textSecondary};font-size:13px;margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;">Open the link on your device to install the eSIM instantly.</p>
            <table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr>
              <td style="padding-right:10px;">
                <a href="${urls.android}" style="display:inline-block;background:${S.androidGreen};color:#ffffff;padding:11px 20px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">🤖 Android</a>
              </td>
              <td>
                <a href="${urls.ios}" style="display:inline-block;background:${S.iosBlack};color:#ffffff;padding:11px 20px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">🍎 iPhone</a>
              </td>
            </tr></table>
          </td>
        </tr>
      </table>`

    await this.sendTemplateEmail(email, 'esim-activated', {
      esimCode,
      androidUrl: urls.android,
      iosUrl: urls.ios,
      activationLinksSection,
    })
  }

  async sendPaymentReceipt(email: string, amount: number): Promise<void> {
    await this.sendTemplateEmail(email, 'payment-receipt', {
      transactionId: 'N/A',
      amount: `$${amount.toFixed(2)}`,
      date: new Date().toLocaleDateString(),
      status: 'Success',
    })
  }

  async sendInvoiceEmail(
    email: string,
    invoiceNumber: string,
    amount: number,
    description: string,
    issuedAt: Date,
    orderReference: string = 'N/A',
    activationCode?: string,
    customerName?: string,
    customerEmail?: string,
  ): Promise<void> {
    let activationSection = ''
    const attachments: nodemailer.SendMailOptions['attachments'] = []

    if (activationCode) {
      const urls = buildActivationUrls(activationCode)

      const qrBuffer = await QRCode.toBuffer(urls.android, { type: 'png', width: 260, margin: 2 })
      attachments.push({
        filename: 'activation-qr.png',
        content: qrBuffer,
        cid: 'activation-qr',
      })

      activationSection = `
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="background:${S.greenLightBg};border:1px solid ${S.greenBorder};border-radius:12px;padding:28px;text-align:center;">

              <!-- Activation Buttons -->
              <p style="color:${S.green};font-size:17px;font-weight:700;margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;">⚡ Activate Your eSIM</p>
              <p style="color:${S.textSecondary};font-size:13px;margin:0 0 20px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
                Tap the button for your device to install the eSIM instantly — no manual entry required.
              </p>
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 20px;">
                <tr>
                  <td style="padding-right:10px;">
                    <a href="${urls.android}" style="display:inline-block;background:${S.androidGreen};color:#ffffff;padding:13px 24px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">🤖 Activate on Android</a>
                  </td>
                  <td>
                    <a href="${urls.ios}" style="display:inline-block;background:${S.iosBlack};color:#ffffff;padding:13px 24px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">🍎 Activate on iPhone</a>
                  </td>
                </tr>
              </table>

              <!-- Or / QR -->
              <p style="color:${S.textFaint};font-size:12px;margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;">— or scan the QR code below —</p>

              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 16px;">
                <tr>
                  <td style="background:#ffffff;border-radius:10px;padding:12px;border:1px solid ${S.greenBorder};">
                    <img src="cid:activation-qr" alt="eSIM QR Code" width="200" height="200" style="display:block;border:0;" />
                  </td>
                </tr>
              </table>

              <!-- Manual code -->
              <p style="color:${S.textMuted};font-size:12px;margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;">Manual activation code:</p>
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
                <tr>
                  <td style="background:#ffffff;border:1px solid ${S.greenBorder};border-radius:8px;padding:12px 20px;">
                    <span style="color:${S.green};font-size:14px;font-weight:700;font-family:Courier New,Courier,monospace;letter-spacing:0.5px;">${activationCode}</span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>`
    }

    const pdfBuffer = await generateInvoicePdfBuffer({
      invoiceNumber,
      amount,
      description,
      issuedAt,
      orderReference,
      activationCode,
      customerName,
      customerEmail,
    })

    attachments.unshift({
      filename: `${invoiceNumber}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    })

    await this.sendTemplateEmail(email, 'invoice', {
      invoiceNumber,
      activationSection,
    }, attachments)
  }

  async sendWelcomeEmail(email: string, name: string, dashboardLink: string): Promise<void> {
    await this.sendTemplateEmail(email, 'welcome', { name, dashboardLink })
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    await this.sendTemplateEmail(email, 'password-reset', { resetLink })
  }

  async sendPasswordChangedEmail(email: string, supportLink: string = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/support`): Promise<void> {
    await this.sendTemplateEmail(email, 'password-changed', { supportLink })
  }
}

export default new EmailService()
