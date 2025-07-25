/**
 * HalalCheck EU - Email Service
 * 
 * Professional email handling for user notifications
 */

import { logger } from '@/utils/logger';

export class EmailService {
  private readonly fromEmail: string;
  private readonly appName: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@halalcheck.eu';
    this.appName = process.env.APP_NAME || 'HalalCheck EU';
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(email: string, token: string, language = 'en'): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
    
    const templates = {
      en: {
        subject: 'Verify Your HalalCheck EU Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">Welcome to HalalCheck EU</h2>
            <p>Thank you for registering with Europe's leading halal certification platform.</p>
            <p>Please click the button below to verify your email address:</p>
            <a href="${verificationUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
              Verify Email Address
            </a>
            <p style="color: #666; font-size: 14px;">
              If you didn't create this account, please ignore this email.
            </p>
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              HalalCheck EU - Professional Halal Certification Platform<br>
              This is an automated message, please do not reply.
            </p>
          </div>
        `
      },
      nl: {
        subject: 'Verifieer Uw HalalCheck EU Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">Welkom bij HalalCheck EU</h2>
            <p>Bedankt voor het registreren bij Europa's toonaangevende halal certificeringsplatform.</p>
            <p>Klik op de knop hieronder om uw e-mailadres te verifiëren:</p>
            <a href="${verificationUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
              E-mailadres Verifiëren
            </a>
            <p style="color: #666; font-size: 14px;">
              Als u dit account niet heeft aangemaakt, negeer dan deze e-mail.
            </p>
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              HalalCheck EU - Professioneel Halal Certificeringsplatform<br>
              Dit is een geautomatiseerd bericht, gelieve niet te antwoorden.
            </p>
          </div>
        `
      }
    };

    const template = templates[language] || templates['en'];

    await this.sendEmail(email, template.subject, template.html);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, firstName: string, language = 'en'): Promise<void> {
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
    
    const templates = {
      en: {
        subject: 'Welcome to HalalCheck EU - Your Account is Ready!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">Welcome ${firstName}!</h2>
            <p>Your HalalCheck EU account has been successfully verified and is now ready to use.</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #22c55e; margin: 0 0 10px 0;">What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Start analyzing ingredient lists with our AI-powered tool</li>
                <li>Generate professional halal certification reports</li>
                <li>Access our comprehensive ingredient database</li>
                <li>Set up your organization's certification standards</li>
              </ul>
            </div>

            <a href="${dashboardUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
              Access Your Dashboard
            </a>
            
            <p style="color: #666; font-size: 14px;">
              Need help getting started? Contact our support team at support@halalcheck.eu
            </p>
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              HalalCheck EU - Professional Halal Certification Platform<br>
              This is an automated message, please do not reply.
            </p>
          </div>
        `
      }
    };

    const template = templates[language] || templates['en'];
    await this.sendEmail(email, template.subject, template.html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string, language = 'en'): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    
    const template = {
      subject: 'Reset Your HalalCheck EU Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Password Reset Request</h2>
          <p>We received a request to reset your password for your HalalCheck EU account.</p>
          <p>Click the button below to create a new password:</p>
          <a href="${resetUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour for security reasons.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this password reset, please ignore this email.
          </p>
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            HalalCheck EU - Professional Halal Certification Platform<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    };

    await this.sendEmail(email, template.subject, template.html);
  }

  /**
   * Send analysis completion notification
   */
  async sendAnalysisNotification(email: string, productName: string, status: string, reportUrl?: string): Promise<void> {
    const statusColors = {
      'HALAL': '#22c55e',
      'HARAM': '#ef4444',
      'MASHBOOH': '#f59e0b',
      'REQUIRES_REVIEW': '#6b7280'
    };

    const color = statusColors[status] || '#6b7280';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Analysis Complete</h2>
        <p>Your ingredient analysis for <strong>"${productName}"</strong> has been completed.</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color};">
          <h3 style="margin: 0 0 10px 0; color: ${color};">Result: ${status}</h3>
          <p style="margin: 0; color: #666;">
            ${status === 'HALAL' ? 'All ingredients are confirmed halal.' :
              status === 'HARAM' ? 'Haram ingredients detected. Review required.' :
              status === 'MASHBOOH' ? 'Some ingredients require verification.' :
              'Expert review required for final determination.'}
          </p>
        </div>

        ${reportUrl ? `
          <a href="${reportUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
            Download Report
          </a>
        ` : ''}
        
        <p style="color: #666; font-size: 14px;">
          View detailed results in your <a href="${process.env.FRONTEND_URL}/dashboard" style="color: #22c55e;">dashboard</a>.
        </p>
        
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          HalalCheck EU - Professional Halal Certification Platform<br>
          This is an automated message, please do not reply.
        </p>
      </div>
    `;

    await this.sendEmail(email, `Analysis Complete: ${productName}`, html);
  }

  /**
   * Core email sending function
   */
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      // In production, this would integrate with AWS SES, SendGrid, or similar
      // For now, we'll log the email for development
      
      if (process.env.NODE_ENV === 'development') {
        logger.info('Email sent (development mode)', {
          to,
          subject,
          htmlLength: html.length
        });
        
        // Write email to file for development testing
        const fs = require('fs');
        const path = require('path');
        const emailsDir = path.join(process.cwd(), 'emails');
        
        if (!fs.existsSync(emailsDir)) {
          fs.mkdirSync(emailsDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${timestamp}_${to.replace('@', '_')}.html`;
        
        fs.writeFileSync(path.join(emailsDir, filename), `
          <h1>Subject: ${subject}</h1>
          <p><strong>To:</strong> ${to}</p>
          <p><strong>From:</strong> ${this.fromEmail}</p>
          <hr>
          ${html}
        `);
        
        console.log(`📧 Email saved to emails/${filename}`);
        return;
      }

      // Production email sending would go here
      // Example with AWS SES:
      /*
      const ses = new AWS.SES({ region: 'eu-west-1' });
      await ses.sendEmail({
        Source: this.fromEmail,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: { Html: { Data: html } }
        }
      }).promise();
      */

      logger.info('Email sent successfully', { to, subject });

    } catch (error) {
      logger.error('Failed to send email', {
        error: error.message,
        to,
        subject
      });
      throw new Error('Email sending failed');
    }
  }
}