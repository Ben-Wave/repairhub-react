// backend/services/emailService.js - ERWEITERT um Device Assignment E-Mails
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
          name: to.split('@')[0]
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

  // NEU: E-Mail bei Gerätezuweisung an Reseller
  async sendDeviceAssignmentNotification(reseller, device, assignment, adminName) {
    const confirmUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reseller/dashboard?confirm=${assignment._id}`;
    
    const subject = '📱 Neues Gerät zugewiesen - RepairHub';
    
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
          .device-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .device-image { width: 80px; height: 80px; object-fit: contain; margin-right: 15px; float: left; }
          .price-box { background: #f0fdf4; border: 1px solid #16a34a; border-radius: 6px; padding: 15px; margin: 15px 0; }
          .button { 
            display: inline-block; 
            background: #16a34a; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: bold;
            margin: 20px 0; 
          }
          .button:hover { background: #15803d; }
          .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
          .info-item { background: #f9fafb; padding: 10px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📱 Neues Gerät zugewiesen!</h1>
            <p>RepairHub Reseller-Portal</p>
          </div>
          
          <div class="content">
            <h2>Hallo ${reseller.name}!</h2>
            
            <p>Ihnen wurde ein neues Gerät zum Verkauf zugewiesen. Bestätigen Sie bitte den Erhalt.</p>
            
            <div class="device-card">
              <div style="overflow: hidden;">
                ${device.thumbnail ? `<img src="${device.thumbnail}" alt="${device.model}" class="device-image">` : ''}
                <div style="margin-left: ${device.thumbnail ? '95px' : '0'};">
                  <h3 style="margin: 0 0 10px 0; color: #1f2937;">${device.model}</h3>
                  <p style="margin: 5px 0; color: #6b7280;"><strong>IMEI:</strong> ${device.imei}</p>
                  ${device.modelDesc ? `<p style="margin: 5px 0; color: #6b7280;">${device.modelDesc}</p>` : ''}
                </div>
              </div>
              
              <div class="info-grid">
                <div class="info-item">
                  <strong>💰 Ihr Gewinnpotenzial:</strong><br>
                  <span style="color: #059669; font-weight: bold;">
                    ${Math.round((assignment.minimumPrice * 0.1))}€ - ${Math.round((assignment.minimumPrice * 0.3))}€
                  </span><br>
                  <small style="color: #6b7280;">Bei 10-30% Aufschlag</small>
                </div>
                <div class="info-item">
                  <strong>Zugewiesen am:</strong><br>
                  ${new Date(assignment.assignedAt).toLocaleDateString('de-DE')}
                </div>
                ${device.damageDescription ? `
                <div class="info-item" style="grid-column: 1 / -1;">
                  <strong>Zustand:</strong><br>
                  <span style="color: #d97706;">${device.damageDescription}</span>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="price-box">
              <h3 style="margin: 0 0 10px 0; color: #16a34a;">💰 Gewinn-System</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <strong>Mindestverkaufspreis:</strong><br>
                  <span style="font-size: 24px; color: #16a34a; font-weight: bold;">${assignment.minimumPrice}€</span><br>
                  <small style="color: #059669;">→ Geht an RepairHub</small>
                </div>
                <div>
                  <strong>Ihr Gewinn:</strong><br>
                  <span style="font-size: 20px; color: #059669; font-weight: bold;">
                    Alles über ${assignment.minimumPrice}€
                  </span><br>
                  <small style="color: #059669;">→ Gehört Ihnen!</small>
                </div>
              </div>
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #16a34a;">
                <p style="margin: 0; font-size: 14px; color: #166534;">
                  <strong>Beispiel:</strong> Verkauf für 400€ → RepairHub: ${assignment.minimumPrice}€, Sie: ${400 - assignment.minimumPrice}€
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" class="button">
                ✅ Erhalt bestätigen & zum Dashboard
              </a>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">📋 Nächste Schritte:</h4>
              <ol style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>Klicken Sie auf "Erhalt bestätigen"</li>
                <li>Loggen Sie sich in Ihr Reseller-Dashboard ein</li>
                <li>Warten Sie auf die Zusendung des Geräts</li>
                <li>Verkaufen Sie das Gerät zu Ihrem Wunschpreis</li>
                <li>Melden Sie den Verkauf im Dashboard</li>
              </ol>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #1d4ed8;">ℹ️ Wichtige Informationen:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
                <li>Das Gerät ist vollständig repariert und verkaufsbereit</li>
                <li>Sie können jeden Preis über dem Mindestpreis verlangen</li>
                <li>Bei Fragen wenden Sie sich an: ${adminName || 'Ihren RepairHub-Kontakt'}</li>
                <li>Alle Verkäufe werden im Dashboard dokumentiert</li>
              </ul>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p><strong>Direkter Link zum Dashboard:</strong><br>
            <a href="${confirmUrl}" style="word-break: break-all; color: #16a34a;">${confirmUrl}</a></p>
          </div>
          
          <div class="footer">
            <p>Zugewiesen von: ${adminName || 'RepairHub Admin'}</p>
            <p>Bei Fragen antworten Sie einfach auf diese E-Mail.</p>
            <p>© ${new Date().getFullYear()} RepairHub - Reseller-Netzwerk</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Neues Gerät zugewiesen - RepairHub

Hallo ${reseller.name}!

Ihnen wurde ein neues Gerät zum Verkauf zugewiesen:

Gerät: ${device.model}
IMEI: ${device.imei}
Mindestverkaufspreis: ${assignment.minimumPrice}€
Ihr Gewinn: Alles über ${assignment.minimumPrice}€

Bestätigen Sie den Erhalt unter:
${confirmUrl}

Zugewiesen von: ${adminName || 'RepairHub Admin'}

© ${new Date().getFullYear()} RepairHub
    `;

    return await this.sendEmail(reseller.email, subject, htmlContent, textContent);
  }

  // NEU: E-Mail an Admin bei Erhalt-Bestätigung durch Reseller
  async sendAssignmentConfirmationToAdmin(adminEmail, reseller, device, assignment) {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/resellers`;
    
    const subject = `✅ Gerät-Erhalt bestätigt: ${device.model} (${reseller.name})`;
    
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
          .success-box { background: #f0fdf4; border: 1px solid #16a34a; border-radius: 6px; padding: 15px; margin: 15px 0; }
          .device-info { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0; }
          .button { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            padding: 12px 25px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 15px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Erhalt bestätigt</h1>
            <p>RepairHub Admin-Benachrichtigung</p>
          </div>
          
          <div class="content">
            <div class="success-box">
              <h3 style="margin: 0 0 10px 0; color: #16a34a;">📱 Gerät-Erhalt bestätigt</h3>
              <p style="margin: 0; color: #166534;">
                <strong>${reseller.name}</strong> hat den Erhalt des zugewiesenen Geräts bestätigt.
              </p>
            </div>
            
            <div class="device-info">
              <h4 style="margin: 0 0 15px 0; color: #374151;">Geräte-Details:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><strong>Modell:</strong><br>${device.model}</div>
                <div><strong>IMEI:</strong><br>${device.imei}</div>
                <div><strong>Mindestpreis:</strong><br>${assignment.minimumPrice}€</div>
                <div><strong>Status:</strong><br><span style="color: #059669;">Beim Reseller</span></div>
              </div>
            </div>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0;">
              <h4 style="margin: 0 0 15px 0; color: #374151;">Reseller-Details:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><strong>Name:</strong><br>${reseller.name}</div>
                <div><strong>Username:</strong><br>@${reseller.username}</div>
                <div><strong>E-Mail:</strong><br>${reseller.email}</div>
                <div><strong>Bestätigt am:</strong><br>${new Date().toLocaleString('de-DE')}</div>
              </div>
              ${reseller.company ? `<div style="margin-top: 10px;"><strong>Firma:</strong> ${reseller.company}</div>` : ''}
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">📋 Nächste Schritte:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>Gerät kann jetzt versendet werden</li>
                <li>Reseller wartet auf Lieferung</li>
                <li>Nach Verkauf erhalten Sie automatisch eine Benachrichtigung</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="button">
                📊 Zum Admin-Dashboard
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; margin-top: 30px; font-size: 14px;">
            <p>Automatische Benachrichtigung vom RepairHub-System</p>
            <p>© ${new Date().getFullYear()} RepairHub</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Gerät-Erhalt bestätigt - RepairHub

${reseller.name} hat den Erhalt des zugewiesenen Geräts bestätigt.

Gerät: ${device.model}
IMEI: ${device.imei}
Mindestpreis: ${assignment.minimumPrice}€
Bestätigt am: ${new Date().toLocaleString('de-DE')}

Reseller: ${reseller.name} (@${reseller.username})
E-Mail: ${reseller.email}

Admin-Dashboard: ${dashboardUrl}

© ${new Date().getFullYear()} RepairHub
    `;

    return await this.sendEmail(adminEmail, subject, htmlContent, textContent);
  }

  // NEU: E-Mail an Admin bei Verkauf durch Reseller
  async sendSaleNotificationToAdmin(adminEmail, reseller, device, assignment, salePrice) {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/resellers`;
    const profit = salePrice - assignment.minimumPrice;
    const resellerProfit = Math.max(0, profit);
    
    const subject = `💰 Gerät verkauft: ${device.model} für ${salePrice}€ (${reseller.name})`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .sale-box { background: #f0fdf4; border: 1px solid #16a34a; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .profit-breakdown { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0; }
          .button { 
            display: inline-block; 
            background: #059669; 
            color: white; 
            padding: 12px 25px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 15px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Gerät verkauft!</h1>
            <p>RepairHub Verkaufs-Benachrichtigung</p>
          </div>
          
          <div class="content">
            <div class="sale-box">
              <h3 style="margin: 0 0 15px 0; color: #16a34a;">🎉 Erfolgreicher Verkauf</h3>
              <div style="text-align: center; margin: 15px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #16a34a; margin-bottom: 5px;">
                  ${salePrice}€
                </div>
                <div style="color: #166534;">Verkaufspreis</div>
              </div>
              <p style="text-align: center; margin: 0; color: #166534;">
                Verkauft von <strong>${reseller.name}</strong>
              </p>
            </div>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0;">
              <h4 style="margin: 0 0 15px 0; color: #374151;">Geräte-Details:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><strong>Modell:</strong><br>${device.model}</div>
                <div><strong>IMEI:</strong><br>${device.imei}</div>
                <div><strong>Verkauft am:</strong><br>${new Date().toLocaleString('de-DE')}</div>
                <div><strong>Status:</strong><br><span style="color: #dc2626;">Verkauft</span></div>
              </div>
            </div>
            
            <div class="profit-breakdown">
              <h4 style="margin: 0 0 15px 0; color: #374151;">💰 Gewinn-Aufschlüsselung:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center;">
                <div style="padding: 10px; background: #fef3c7; border-radius: 4px;">
                  <div style="font-size: 20px; font-weight: bold; color: #92400e;">
                    ${assignment.minimumPrice}€
                  </div>
                  <div style="font-size: 12px; color: #92400e;">RepairHub</div>
                </div>
                <div style="padding: 10px; background: #f0fdf4; border-radius: 4px;">
                  <div style="font-size: 20px; font-weight: bold; color: #16a34a;">
                    ${resellerProfit}€
                  </div>
                  <div style="font-size: 12px; color: #16a34a;">Reseller</div>
                </div>
                <div style="padding: 10px; background: #eff6ff; border-radius: 4px;">
                  <div style="font-size: 20px; font-weight: bold; color: #2563eb;">
                    ${salePrice}€
                  </div>
                  <div style="font-size: 12px; color: #2563eb;">Gesamt</div>
                </div>
              </div>
              
              ${resellerProfit > 0 ? `
              <div style="margin-top: 15px; padding: 10px; background: #f0fdf4; border-radius: 4px; text-align: center;">
                <strong style="color: #16a34a;">
                  Reseller-Gewinn: ${resellerProfit}€ (${((resellerProfit / salePrice) * 100).toFixed(1)}% vom Verkaufspreis)
                </strong>
              </div>
              ` : `
              <div style="margin-top: 15px; padding: 10px; background: #fef3c7; border-radius: 4px; text-align: center;">
                <strong style="color: #92400e;">
                  Verkauf zum Mindestpreis - Kein zusätzlicher Reseller-Gewinn
                </strong>
              </div>
              `}
            </div>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0;">
              <h4 style="margin: 0 0 15px 0; color: #374151;">Reseller-Details:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><strong>Name:</strong><br>${reseller.name}</div>
                <div><strong>Username:</strong><br>@${reseller.username}</div>
                <div><strong>E-Mail:</strong><br>${reseller.email}</div>
                <div><strong>Zugewiesen am:</strong><br>${new Date(assignment.assignedAt).toLocaleDateString('de-DE')}</div>
              </div>
              ${reseller.company ? `<div style="margin-top: 10px;"><strong>Firma:</strong> ${reseller.company}</div>` : ''}
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #1d4ed8;">📊 Statistik-Update:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
                <li>Gerätestatus wurde auf "verkauft" aktualisiert</li>
                <li>Zuweisung wurde als "verkauft" markiert</li>
                <li>Reseller-Statistiken wurden aktualisiert</li>
                <li>Gewinn wurde der Gesamtbilanz hinzugefügt</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="button">
                📊 Zum Admin-Dashboard
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; margin-top: 30px; font-size: 14px;">
            <p>Automatische Verkaufs-Benachrichtigung vom RepairHub-System</p>
            <p>© ${new Date().getFullYear()} RepairHub</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Gerät verkauft - RepairHub

${reseller.name} hat das Gerät erfolgreich verkauft:

Gerät: ${device.model}
IMEI: ${device.imei}
Verkaufspreis: ${salePrice}€
Verkauft am: ${new Date().toLocaleString('de-DE')}

Gewinn-Aufschlüsselung:
- RepairHub: ${assignment.minimumPrice}€
- Reseller: ${resellerProfit}€
- Gesamt: ${salePrice}€

Reseller: ${reseller.name} (@${reseller.username})
E-Mail: ${reseller.email}

Admin-Dashboard: ${dashboardUrl}

© ${new Date().getFullYear()} RepairHub
    `;

    return await this.sendEmail(adminEmail, subject, htmlContent, textContent);
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
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reseller/reset-password?token=${resetToken}`;
    
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

  // backend/services/emailService.js - ERWEITERN um neue Workflow-Funktionen
// Diese Funktionen am Ende der EmailService-Klasse hinzufügen:

  // NEU: E-Mail an Admin bei Versand-Freigabe durch Reseller
  async sendShippingApprovalToAdmin(adminEmail, reseller, device, assignment, notes) {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/resellers`;
    
    const subject = `🚀 Versand-Freigabe: ${device.brand} ${device.model} (${reseller.name})`;
    
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
          .approval-box { background: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .device-info { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0; }
          .button { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            padding: 12px 25px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 15px 0; 
            font-weight: bold;
          }
          .action-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Versand-Freigabe erhalten</h1>
            <p>RepairHub Admin-Benachrichtigung</p>
          </div>
          
          <div class="content">
            <div class="approval-box">
              <h3 style="margin: 0 0 15px 0; color: #16a34a;">📦 Bereit zum Versand</h3>
              <p style="margin: 0; color: #166534; font-size: 16px;">
                <strong>${reseller.name}</strong> hat die Versand-Freigabe für das zugewiesene Gerät erteilt.
              </p>
            </div>
            
            <div class="device-info">
              <h4 style="margin: 0 0 15px 0; color: #374151;">📱 Geräte-Details:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><strong>Modell:</strong><br>${device.brand} ${device.model}</div>
                <div><strong>IMEI:</strong><br>${device.imei}</div>
                <div><strong>Farbe:</strong><br>${device.color}</div>
                <div><strong>Speicher:</strong><br>${device.storage}</div>
                <div><strong>Zustand:</strong><br>${device.condition}</div>
                <div><strong>Preis:</strong><br>€${device.price}</div>
              </div>
              ${device.damageDescription ? `
                <div style="margin-top: 10px; padding: 10px; background: #fef3c7; border-radius: 4px;">
                  <strong>Schadensbeschreibung:</strong><br>
                  <span style="color: #92400e;">${device.damageDescription}</span>
                </div>
              ` : ''}
            </div>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0;">
              <h4 style="margin: 0 0 15px 0; color: #374151;">👤 Reseller-Details:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><strong>Name:</strong><br>${reseller.name}</div>
                <div><strong>Username:</strong><br>@${reseller.username}</div>
                <div><strong>E-Mail:</strong><br>${reseller.email}</div>
                <div><strong>Freigabe am:</strong><br>${new Date().toLocaleString('de-DE')}</div>
              </div>
              ${reseller.phone ? `<div style="margin-top: 10px;"><strong>📱 Telefon:</strong> ${reseller.phone}</div>` : ''}
              ${reseller.company ? `<div style="margin-top: 5px;"><strong>🏢 Firma:</strong> ${reseller.company}</div>` : ''}
            </div>
            
            ${notes ? `
              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #92400e;">💬 Reseller-Notizen:</h4>
                <p style="margin: 0; white-space: pre-wrap; color: #92400e;">${notes}</p>
              </div>
            ` : ''}
            
            <div class="action-box">
              <h4 style="margin: 0 0 15px 0; color: #92400e;">📋 Nächste Schritte:</h4>
              <ol style="margin: 0; padding-left: 20px; color: #92400e;">
                <li><strong>Versandart wählen:</strong> DHL, persönliche Übergabe oder andere</li>
                <li><strong>Bei DHL:</strong> Tracking-Nummer eingeben für automatischen Link</li>
                <li><strong>Gerät verpacken</strong> und versenden/übergeben</li>
                <li><strong>Versand dokumentieren</strong> - Reseller wird automatisch benachrichtigt</li>
              </ol>
            </div>
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="button">
                📦 Versand jetzt durchführen
              </a>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #1d4ed8;">ℹ️ Versand-Optionen:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
                <li><strong>🚚 DHL:</strong> Automatischer Tracking-Link wird generiert</li>
                <li><strong>🤝 Persönlich:</strong> Übergabe wird dokumentiert</li>
                <li><strong>📮 Andere:</strong> Individuelle Versandart</li>
              </ul>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; margin-top: 30px; font-size: 14px;">
            <p>Automatische Benachrichtigung vom RepairHub-System</p>
            <p>© ${new Date().getFullYear()} RepairHub</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Versand-Freigabe erhalten - RepairHub

${reseller.name} hat die Versand-Freigabe für das zugewiesene Gerät erteilt.

Gerät: ${device.brand} ${device.model}
IMEI: ${device.imei}
Preis: €${device.price}

Reseller: ${reseller.name} (@${reseller.username})
E-Mail: ${reseller.email}
Freigabe am: ${new Date().toLocaleString('de-DE')}

${notes ? `Reseller-Notizen: ${notes}\n` : ''}

Nächste Schritte:
1. Versandart wählen (DHL, persönliche Übergabe, etc.)
2. Gerät verpacken und versenden
3. Versand im Admin-Dashboard dokumentieren

Admin-Dashboard: ${dashboardUrl}

© ${new Date().getFullYear()} RepairHub
    `;

    return await this.sendEmail(adminEmail, subject, htmlContent, textContent);
  }

  // NEU: E-Mail an Reseller bei Versand durch Admin
  async sendShippingNotificationToReseller(reseller, device, assignment, adminName) {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reseller/dashboard`;
    const shipping = assignment.shippingInfo;
    const isPickup = shipping.method === 'pickup';
    const isDHL = shipping.method === 'dhl';
    
    const subject = isPickup 
      ? `🤝 Persönliche Übergabe: ${device.brand} ${device.model}`
      : `📦 Gerät versendet: ${device.brand} ${device.model}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .shipping-info { background: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .tracking-box { background: white; border: 2px solid #2563eb; border-radius: 6px; padding: 15px; margin: 15px 0; text-align: center; }
          .button { 
            display: inline-block; 
            background: #059669; 
            color: white; 
            padding: 12px 25px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 15px 0; 
            font-weight: bold;
          }
          .tracking-button { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            padding: 12px 25px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 10px 0; 
            font-weight: bold;
          }
          .warning-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isPickup ? '🤝 Persönliche Übergabe' : '📦 Gerät versendet'}</h1>
            <p>RepairHub Versand-Benachrichtigung</p>
          </div>
          
          <div class="content">
            <h2>Hallo ${reseller.name}!</h2>
            
            <p>${isPickup ? 
              'Die persönliche Übergabe Ihres zugewiesenen Geräts wurde dokumentiert.' : 
              'Ihr zugewiesenes Gerät wurde versendet und ist unterwegs zu Ihnen!'
            }</p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0;">
              <h4 style="margin: 0 0 15px 0; color: #374151;">📱 Geräte-Details:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><strong>Modell:</strong><br>${device.brand} ${device.model}</div>
                <div><strong>IMEI:</strong><br>${device.imei}</div>
                <div><strong>Farbe:</strong><br>${device.color}</div>
                <div><strong>Speicher:</strong><br>${device.storage}</div>
              </div>
            </div>
            
            <div class="shipping-info">
              <h3 style="margin: 0 0 15px 0; color: #16a34a;">📦 Versand-Informationen</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <strong>Versandart:</strong><br>
                  ${isDHL ? '📦 DHL Paket' : isPickup ? '🤝 Persönliche Übergabe' : '📮 Andere Versandart'}
                </div>
                <div>
                  <strong>Versendet am:</strong><br>
                  ${new Date(shipping.shippedAt).toLocaleString('de-DE')}
                </div>
                <div>
                  <strong>Versendet von:</strong><br>
                  ${adminName}
                </div>
                ${shipping.estimatedDelivery ? `
                <div>
                  <strong>Geschätzte Lieferung:</strong><br>
                  <span style="color: #16a34a; font-weight: bold;">
                    ${new Date(shipping.estimatedDelivery).toLocaleDateString('de-DE')}
                  </span>
                </div>
                ` : ''}
              </div>
            </div>
            
            ${isDHL && shipping.trackingNumber ? `
              <div class="tracking-box">
                <h4 style="margin: 0 0 10px 0; color: #2563eb;">📍 Sendungsverfolgung</h4>
                <div style="font-family: monospace; font-size: 18px; font-weight: bold; color: #1e40af; margin: 10px 0;">
                  ${shipping.trackingNumber}
                </div>
                ${shipping.trackingUrl ? `
                  <a href="${shipping.trackingUrl}" target="_blank" class="tracking-button">
                    🔍 Sendung verfolgen (DHL)
                  </a>
                ` : ''}
                <p style="font-size: 14px; color: #64748b; margin: 10px 0 0 0;">
                  Klicken Sie auf den Button für aktuelle Standort-Informationen
                </p>
              </div>
            ` : ''}
            
            ${shipping.recipientAddress ? `
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0;">
                <h4 style="margin: 0 0 10px 0; color: #374151;">📍 Lieferadresse:</h4>
                <p style="margin: 0; white-space: pre-line; color: #6b7280;">${shipping.recipientAddress}</p>
              </div>
            ` : ''}
            
            <div class="warning-box">
              <h4 style="margin: 0 0 15px 0; color: #92400e;">
                ${isPickup ? '✅ Nach der Übergabe:' : '⚠️ Nach dem Erhalt:'}
              </h4>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li><strong>Erhalt im System bestätigen</strong> - Sehr wichtig!</li>
                <li><strong>Gerät auf Vollständigkeit prüfen</strong></li>
                <li><strong>Zustand bewerten</strong> und eventuelle Probleme melden</li>
                <li><strong>Erst nach Bestätigung</strong> mit dem Verkauf beginnen</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="button">
                📊 Zum Reseller-Dashboard
              </a>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #1d4ed8;">💡 Verkaufs-Tipps:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
                <li>Das Gerät ist professionell repariert und verkaufsbereit</li>
                <li>Sie können jeden Preis über dem Mindestpreis verlangen</li>
                <li>Hochwertige Fotos steigern den Verkaufserfolg</li>
                <li>Bei Fragen stehen wir Ihnen gerne zur Verfügung</li>
              </ul>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; margin-top: 30px; font-size: 14px;">
            <p>Automatische Versand-Benachrichtigung vom RepairHub-System</p>
            <p>© ${new Date().getFullYear()} RepairHub</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
${isPickup ? 'Persönliche Übergabe dokumentiert' : 'Gerät versendet'} - RepairHub

Hallo ${reseller.name}!

${isPickup ? 
  'Die persönliche Übergabe Ihres Geräts wurde dokumentiert.' : 
  'Ihr Gerät wurde versendet und ist unterwegs!'
}

Gerät: ${device.brand} ${device.model}
IMEI: ${device.imei}

Versand-Informationen:
- Versandart: ${isDHL ? 'DHL Paket' : isPickup ? 'Persönliche Übergabe' : 'Andere Versandart'}
- Versendet am: ${new Date(shipping.shippedAt).toLocaleString('de-DE')}
- Versendet von: ${adminName}

${isDHL && shipping.trackingNumber ? `
DHL Tracking-Nummer: ${shipping.trackingNumber}
${shipping.trackingUrl ? `Tracking-Link: ${shipping.trackingUrl}` : ''}
` : ''}

${shipping.estimatedDelivery ? `Geschätzte Lieferung: ${new Date(shipping.estimatedDelivery).toLocaleDateString('de-DE')}` : ''}

WICHTIG: Bestätigen Sie den Erhalt im System bevor Sie mit dem Verkauf beginnen!

Reseller-Dashboard: ${dashboardUrl}

© ${new Date().getFullYear()} RepairHub
    `;

    return await this.sendEmail(reseller.email, subject, htmlContent, textContent);
  }

  // NEU: E-Mail an Admin bei Erhalt-Bestätigung durch Reseller
  async sendDeliveryConfirmationToAdmin(adminEmail, reseller, device, assignment, deliveryInfo) {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/resellers`;
    const hasIssues = deliveryInfo.issues && deliveryInfo.issues.trim();
    const condition = deliveryInfo.condition || 'gut';
    
    const subject = hasIssues 
      ? `⚠️ Erhalt mit Problemen: ${device.brand} ${device.model} (${reseller.name})`
      : `✅ Erhalt bestätigt: ${device.brand} ${device.model} (${reseller.name})`;
    
    const conditionColors = {
      'ausgezeichnet': { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' },
      'gut': { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' },
      'okay': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
      'problematisch': { bg: '#fef2f2', border: '#dc2626', text: '#dc2626' }
    };
    
    const conditionStyle = conditionColors[condition] || conditionColors['gut'];
    
    const conditionIcons = {
      'ausgezeichnet': '⭐⭐⭐',
      'gut': '⭐⭐',
      'okay': '⭐',
      'problematisch': '❌'
    };
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${hasIssues ? '#dc2626' : '#059669'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-box { background: ${hasIssues ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${hasIssues ? '#fecaca' : '#bbf7d0'}; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .condition-box { background: ${conditionStyle.bg}; border: 1px solid ${conditionStyle.border}; border-radius: 6px; padding: 15px; margin: 15px 0; }
          .issues-box { background: #fef2f2; border: 2px solid #dc2626; border-radius: 6px; padding: 15px; margin: 20px 0; }
          .button { 
            display: inline-block; 
            background: ${hasIssues ? '#dc2626' : '#059669'}; 
            color: white; 
            padding: 12px 25px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 15px 0; 
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${hasIssues ? '⚠️ Erhalt mit Problemen' : '✅ Erhalt bestätigt'}</h1>
            <p>RepairHub Admin-Benachrichtigung</p>
          </div>
          
          <div class="content">
            <div class="status-box">
              <h3 style="margin: 0 0 15px 0; color: ${hasIssues ? '#dc2626' : '#16a34a'};">
                ${hasIssues ? '⚠️ Probleme gemeldet' : '📦 Erfolgreich zugestellt'}
              </h3>
              <p style="margin: 0; color: ${hasIssues ? '#7f1d1d' : '#166534'}; font-size: 16px;">
                <strong>${reseller.name}</strong> hat den Erhalt des Geräts bestätigt${hasIssues ? ' und Probleme gemeldet' : ''}.
              </p>
            </div>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0;">
              <h4 style="margin: 0 0 15px 0; color: #374151;">📱 Geräte-Details:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><strong>Modell:</strong><br>${device.brand} ${device.model}</div>
                <div><strong>IMEI:</strong><br>${device.imei}</div>
                <div><strong>Farbe:</strong><br>${device.color}</div>
                <div><strong>Speicher:</strong><br>${device.storage}</div>
                <div><strong>Erhalt bestätigt:</strong><br>${new Date(assignment.receivedAt).toLocaleString('de-DE')}</div>
                <div><strong>Status:</strong><br><span style="color: #059669;">Beim Reseller</span></div>
              </div>
            </div>
            
            <div class="condition-box">
              <h4 style="margin: 0 0 15px 0; color: ${conditionStyle.text};">📋 Zustandsbericht</h4>
              <div style="text-align: center; margin: 15px 0;">
                <div style="font-size: 24px; margin-bottom: 5px;">
                  ${conditionIcons[condition] || '⭐⭐'}
                </div>
                <div style="font-size: 18px; font-weight: bold; color: ${conditionStyle.text};">
                  ${condition.charAt(0).toUpperCase() + condition.slice(1)}
                </div>
              </div>
            </div>
            
            ${hasIssues ? `
              <div class="issues-box">
                <h4 style="margin: 0 0 15px 0; color: #dc2626;">⚠️ Gemeldete Probleme:</h4>
                <div style="background: white; padding: 15px; border-radius: 4px; margin: 10px 0;">
                  <p style="margin: 0; white-space: pre-wrap; color: #7f1d1d; font-weight: 500;">
                    ${deliveryInfo.issues}
                  </p>
                </div>
                <div style="background: #fee2e2; padding: 10px; border-radius: 4px; margin: 10px 0;">
                  <p style="margin: 0; color: #991b1b; font-size: 14px;">
                    <strong>💡 Empfehlung:</strong> Kontaktieren Sie den Reseller zeitnah, um die Probleme zu klären.
                  </p>
                </div>
              </div>
            ` : ''}
            
            ${deliveryInfo.notes && deliveryInfo.notes.trim() ? `
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0;">
                <h4 style="margin: 0 0 10px 0; color: #374151;">💬 Zusätzliche Notizen:</h4>
                <p style="margin: 0; white-space: pre-wrap; color: #4b5563;">${deliveryInfo.notes}</p>
              </div>
            ` : ''}
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0;">
              <h4 style="margin: 0 0 15px 0; color: #374151;">👤 Reseller-Details:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><strong>Name:</strong><br>${reseller.name}</div>
                <div><strong>Username:</strong><br>@${reseller.username}</div>
                <div><strong>E-Mail:</strong><br>${reseller.email}</div>
                <div><strong>Zugewiesen am:</strong><br>${new Date(assignment.assignedAt).toLocaleDateString('de-DE')}</div>
              </div>
              ${reseller.phone ? `<div style="margin-top: 10px;"><strong>📱 Telefon:</strong> ${reseller.phone}</div>` : ''}
            </div>
            
            ${assignment.shippingInfo ? `
              <div style="background: #e0f2fe; border: 1px solid #0369a1; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #0369a1;">📦 Versand-Rückblick:</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; color: #0c4a6e; font-size: 14px;">
                  <div><strong>Versandart:</strong><br>${
                    assignment.shippingInfo.method === 'dhl' ? '📦 DHL Paket' :
                    assignment.shippingInfo.method === 'pickup' ? '🤝 Persönliche Übergabe' :
                    '📮 Andere Versandart'
                  }</div>
                  <div><strong>Versendet am:</strong><br>${new Date(assignment.shippingInfo.shippedAt).toLocaleDateString('de-DE')}</div>
                  ${assignment.shippingInfo.trackingNumber ? `
                  <div><strong>Tracking:</strong><br>${assignment.shippingInfo.trackingNumber}</div>
                  ` : ''}
                  <div><strong>Lieferzeit:</strong><br>${Math.ceil((new Date(assignment.receivedAt) - new Date(assignment.shippingInfo.shippedAt)) / (1000 * 60 * 60 * 24))} Tage</div>
                </div>
              </div>
            ` : ''}
            
            <div style="background: ${hasIssues ? '#fef3c7' : '#eff6ff'}; border: 1px solid ${hasIssues ? '#f59e0b' : '#3b82f6'}; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 15px 0; color: ${hasIssues ? '#92400e' : '#1d4ed8'};">
                ${hasIssues ? '⚠️ Empfohlene Maßnahmen:' : '📋 Nächste Schritte:'}
              </h4>
              <ul style="margin: 0; padding-left: 20px; color: ${hasIssues ? '#92400e' : '#1e40af'};">
                ${hasIssues ? `
                <li><strong>Reseller kontaktieren</strong> - Probleme besprechen</li>
                <li><strong>Lösungsoptionen prüfen</strong> - Rückgabe, Austausch, Rabatt</li>
                <li><strong>Dokumentation aktualisieren</strong> - Für zukünftige Referenz</li>
                <li><strong>Qualitätskontrolle überprüfen</strong> - Ähnliche Probleme vermeiden</li>
                ` : `
                <li><strong>Reseller kann jetzt verkaufen</strong> - Gerät ist offiziell übergeben</li>
                <li><strong>Verkaufs-Benachrichtigung</strong> - Automatisch bei Verkauf</li>
                <li><strong>Gewinn-Abrechnung</strong> - Nach Verkaufsmeldung</li>
                <li><strong>Feedback sammeln</strong> - Für weitere Optimierungen</li>
                `}
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="button">
                📊 Zum Admin-Dashboard
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; margin-top: 30px; font-size: 14px;">
            <p>Automatische Erhalt-Bestätigung vom RepairHub-System</p>
            <p>© ${new Date().getFullYear()} RepairHub</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
${hasIssues ? 'Erhalt mit Problemen gemeldet' : 'Erhalt bestätigt'} - RepairHub

${reseller.name} hat den Erhalt des Geräts bestätigt${hasIssues ? ' und Probleme gemeldet' : ''}.

Gerät: ${device.brand} ${device.model}
IMEI: ${device.imei}
Erhalt bestätigt: ${new Date(assignment.receivedAt).toLocaleString('de-DE')}

Zustandsbewertung: ${condition} ${conditionIcons[condition] || '⭐⭐'}

${hasIssues ? `
GEMELDETE PROBLEME:
${deliveryInfo.issues}

EMPFOHLENE MASSNAHMEN:
- Reseller zeitnah kontaktieren
- Lösungsoptionen besprechen (Rückgabe, Austausch, Rabatt)
- Qualitätskontrolle überprüfen
` : `
STATUS: Gerät kann jetzt verkauft werden
- Verkaufs-Benachrichtigung erfolgt automatisch
- Gewinn-Abrechnung nach Verkaufsmeldung
`}

${deliveryInfo.notes && deliveryInfo.notes.trim() ? `
Zusätzliche Notizen:
${deliveryInfo.notes}
` : ''}

Reseller: ${reseller.name} (@${reseller.username})
E-Mail: ${reseller.email}

${assignment.shippingInfo ? `
Versand-Rückblick:
- Versandart: ${
  assignment.shippingInfo.method === 'dhl' ? 'DHL Paket' :
  assignment.shippingInfo.method === 'pickup' ? 'Persönliche Übergabe' :
  'Andere Versandart'
}
- Versendet am: ${new Date(assignment.shippingInfo.shippedAt).toLocaleDateString('de-DE')}
- Lieferzeit: ${Math.ceil((new Date(assignment.receivedAt) - new Date(assignment.shippingInfo.shippedAt)) / (1000 * 60 * 60 * 24))} Tage
${assignment.shippingInfo.trackingNumber ? `- Tracking: ${assignment.shippingInfo.trackingNumber}` : ''}
` : ''}

Admin-Dashboard: ${dashboardUrl}

© ${new Date().getFullYear()} RepairHub
    `;

    return await this.sendEmail(adminEmail, subject, htmlContent, textContent);
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