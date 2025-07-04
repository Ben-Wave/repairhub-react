// backend/services/emailService.js - KOMPLETT mit User & Reseller Templates
const axios = require('axios');

class EmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.apiUrl = process.env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email';
    this.senderName = process.env.SENDERNAME || 'RepairHub';
    this.senderEmail = process.env.SENDEREMAIL || 'noreply@repairhub.ovh';
    
    if (!this.apiKey) {
      console.warn('⚠️  BREVO_API_KEY nicht gesetzt - E-Mail-Versand deaktiviert');
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    if (!this.apiKey) {
      console.log('📧 E-Mail würde gesendet werden (Testmodus):', { to, subject });
      return { success: true, messageId: 'test-mode' };
    }

    try {
      const payload = {
        sender: {
          name: this.senderName,
          email: this.senderEmail
        },
        to: [{
          email: to,
          name: to.split('@')[0] // Einfacher Name aus E-Mail ableiten
        }],
        subject: subject,
        htmlContent: htmlContent
      };

      if (textContent) {
        payload.textContent = textContent;
      }

      const headers = {
        'accept': 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json'
      };

      console.log('📧 Sende E-Mail an:', to);
      console.log('📧 API-URL:', this.apiUrl);
      console.log('📧 API-Key vorhanden:', !!this.apiKey);

      const response = await axios.post(this.apiUrl, payload, { headers });

      if (response.status === 201) {
        console.log('✅ E-Mail erfolgreich gesendet an:', to);
        return { 
          success: true, 
          messageId: response.data.messageId 
        };
      } else {
        throw new Error(`Unerwarteter Status: ${response.status}`);
      }

    } catch (error) {
      console.error('❌ Fehler beim E-Mail-Versand:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  // Template für Benutzer-Einladung (Admin-User)
  async sendUserInvitation(email, inviteToken, userName = null) {
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?token=${inviteToken}`;
    
    const subject = '🚀 Willkommen bei RepairHub - Vervollständigen Sie Ihre Registrierung';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RepairHub</h1>
            <p>Smartphone-Manager System</p>
          </div>
          
          <div class="content">
            <h2>Willkommen${userName ? `, ${userName}` : ''}!</h2>
            
            <p>Sie wurden zu RepairHub eingeladen. Um Ihren Account zu aktivieren und Ihr Passwort zu setzen, klicken Sie bitte auf den Button unten:</p>
            
            <div style="text-align: center;">
              <a href="${inviteUrl}" class="button">🔐 Registrierung vervollständigen</a>
            </div>
            
            <div class="highlight">
              <strong>📧 Ihre E-Mail-Adresse:</strong> ${email}
            </div>
            
            <p><strong>Nächste Schritte:</strong></p>
            <ol>
              <li>Klicken Sie auf den Registrierungs-Button</li>
              <li>Wählen Sie Ihren Benutzernamen</li>
              <li>Setzen Sie ein sicheres Passwort</li>
              <li>Vervollständigen Sie Ihr Profil</li>
            </ol>
            
            <p><small><strong>⏰ Wichtig:</strong> Dieser Einladungslink ist 48 Stunden gültig.</small></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p><strong>Direkter Link (falls Button nicht funktioniert):</strong><br>
            <a href="${inviteUrl}" style="word-break: break-all; color: #2563eb;">${inviteUrl}</a></p>
          </div>
          
          <div class="footer">
            <p>Diese E-Mail wurde automatisch generiert. Bei Fragen wenden Sie sich an Ihren Administrator.</p>
            <p>© ${new Date().getFullYear()} RepairHub</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Willkommen bei RepairHub!

Sie wurden eingeladen, RepairHub zu nutzen. 

Vervollständigen Sie Ihre Registrierung unter:
${inviteUrl}

Ihre E-Mail-Adresse: ${email}

Dieser Link ist 48 Stunden gültig.

© ${new Date().getFullYear()} RepairHub
    `;

    return await this.sendEmail(email, subject, htmlContent, textContent);
  }

  // Template für Reseller-Einladung
  async sendResellerInvitation(email, inviteToken, userName = null, company = null) {
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register-reseller?token=${inviteToken}`;
    
    const subject = '🏪 Willkommen als RepairHub Reseller - Vervollständigen Sie Ihre Registrierung';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { 
            display: inline-block; 
            background: #16a34a; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
          .highlight { background: #dcfce7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #16a34a; }
          .benefits { background: #fff; padding: 20px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏪 RepairHub Reseller</h1>
            <p>Willkommen im Händler-Netzwerk</p>
          </div>
          
          <div class="content">
            <h2>Herzlich willkommen${userName ? `, ${userName}` : ''}${company ? ` von ${company}` : ''}!</h2>
            
            <p>Sie wurden als offizieller RepairHub-Reseller eingeladen. Mit unserem Händler-Portal können Sie hochwertige, reparierte Smartphones verkaufen und dabei attraktive Gewinne erzielen.</p>
            
            <div style="text-align: center;">
              <a href="${inviteUrl}" class="button">🔐 Reseller-Account aktivieren</a>
            </div>
            
            <div class="highlight">
              <strong>📧 Ihre Reseller-E-Mail:</strong> ${email}
              ${company ? `<br><strong>🏢 Unternehmen:</strong> ${company}` : ''}
            </div>
            
            <div class="benefits">
              <h3>🎯 Ihre Vorteile als RepairHub-Reseller:</h3>
              <ul>
                <li><strong>💰 Hohe Gewinnmargen</strong> - Sie behalten alles über dem Mindestpreis</li>
                <li><strong>📱 Geprüfte Geräte</strong> - Alle Smartphones sind professionell repariert</li>
                <li><strong>🔍 Transparente Preise</strong> - Klare Mindestpreise für jeden Artikel</li>
                <li><strong>📊 Echtzeit-Dashboard</strong> - Verwalten Sie Ihr Inventar online</li>
                <li><strong>🚀 Schnelle Abwicklung</strong> - Einfacher Verkaufsprozess</li>
                <li><strong>🤝 Persönlicher Support</strong> - Direkter Kontakt zu RepairHub</li>
              </ul>
            </div>
            
            <p><strong>Nächste Schritte:</strong></p>
            <ol>
              <li>Klicken Sie auf den Aktivierungs-Button</li>
              <li>Wählen Sie Ihren Benutzernamen</li>
              <li>Setzen Sie ein sicheres Passwort</li>
              <li>Vervollständigen Sie Ihr Reseller-Profil</li>
              <li>Erhalten Sie Ihre ersten Geräte-Zuweisungen</li>
            </ol>
            
            <p><small><strong>⏰ Wichtig:</strong> Dieser Einladungslink ist 48 Stunden gültig.</small></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p><strong>Direkter Link (falls Button nicht funktioniert):</strong><br>
            <a href="${inviteUrl}" style="word-break: break-all; color: #16a34a;">${inviteUrl}</a></p>
          </div>
          
          <div class="footer">
            <p>Bei Fragen zum Reseller-Programm wenden Sie sich an Ihren RepairHub-Kontakt.</p>
            <p>© ${new Date().getFullYear()} RepairHub - Reseller-Netzwerk</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Willkommen als RepairHub-Reseller!

Sie wurden eingeladen, Teil unseres Händler-Netzwerks zu werden.

Aktivieren Sie Ihren Reseller-Account unter:
${inviteUrl}

Ihre E-Mail-Adresse: ${email}
${company ? `Unternehmen: ${company}` : ''}

Ihre Vorteile:
- Hohe Gewinnmargen
- Geprüfte Geräte
- Transparente Preise
- Echtzeit-Dashboard
- Persönlicher Support

Dieser Link ist 48 Stunden gültig.

© ${new Date().getFullYear()} RepairHub
    `;

    return await this.sendEmail(email, subject, htmlContent, textContent);
  }

  // Template für Passwort-Reset
  async sendPasswordReset(email, resetToken, userName = null) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const subject = '🔒 RepairHub - Passwort zurücksetzen';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { 
            display: inline-block; 
            background: #dc2626; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Passwort zurücksetzen</h1>
          </div>
          
          <div class="content">
            <h2>Hallo${userName ? ` ${userName}` : ''}!</h2>
            
            <p>Sie haben eine Passwort-Zurücksetzung für Ihren RepairHub Account angefordert.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">🔐 Neues Passwort setzen</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Sicherheitshinweis:</strong> Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail. Ihr Passwort bleibt unverändert.
            </div>
            
            <p><strong>⏰ Gültigkeit:</strong> Dieser Link ist 24 Stunden gültig.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p><strong>Direkter Link:</strong><br>
            <a href="${resetUrl}" style="word-break: break-all; color: #dc2626;">${resetUrl}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, htmlContent);
  }

  // Test-E-Mail senden
  async sendTestEmail(email) {
    const subject = '🚀 RepairHub Test-Mail';
    const htmlContent = `
      <h1>Hallo!</h1>
      <p>Das E-Mail-Setup von RepairHub funktioniert perfekt! ✅</p>
      <p><strong>Zeitstempel:</strong> ${new Date().toLocaleString('de-DE')}</p>
    `;

    return await this.sendEmail(email, subject, htmlContent);
  }
}

module.exports = new EmailService();