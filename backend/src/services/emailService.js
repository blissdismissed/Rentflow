const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  console.error('⚠️ WARNING: SENDGRID_API_KEY is not set in environment variables!');
  console.error('Emails will NOT be sent until SendGrid is configured.');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ SendGrid initialized successfully');
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@aspiretowards.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'AspireTowards';
const REPLY_TO_EMAIL = process.env.SENDGRID_REPLY_TO || process.env.SENDGRID_FROM_EMAIL || 'aspiretowards@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8000';

console.log('📧 Email Service Configuration:');
console.log('  - From Email:', FROM_EMAIL);
console.log('  - From Name:', FROM_NAME);
console.log('  - Reply To Email:', REPLY_TO_EMAIL);
console.log('  - Frontend URL:', FRONTEND_URL);
console.log('  - SendGrid API Key:', SENDGRID_API_KEY ? '✓ Configured' : '✗ Missing');

/**
 * Email Service for RentFlow
 * Handles all transactional emails for the booking system
 */
class EmailService {
  /**
   * Send initial confirmation email to guest when they submit a booking request
   * @param {Object} booking - Booking object with all details
   * @param {Object} property - Property object
   */
  async sendBookingRequestToGuest(booking, property) {
    try {
      const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const msg = {
        to: booking.guestEmail,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        replyTo: REPLY_TO_EMAIL,
        subject: `Booking Request Received - ${property.name} (${booking.confirmationCode})`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .detail-row:last-child { border-bottom: none; }
              .label { font-weight: bold; color: #6b7280; }
              .value { color: #111827; }
              .confirmation-code { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
              .confirmation-code h2 { margin: 0; font-size: 32px; letter-spacing: 2px; }
              .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
              .info-box { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✓ Booking Request Received</h1>
              </div>
              <div class="content">
                <p>Hi ${booking.guestName},</p>

                <p>Thank you for your booking request at <strong>${property.name}</strong>!</p>

                <div class="confirmation-code">
                  <p style="margin: 0; font-size: 14px; opacity: 0.9;">Your Confirmation Code</p>
                  <h2>${booking.confirmationCode}</h2>
                  <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Save this for your records</p>
                </div>

                <div class="highlight">
                  <strong>⏰ What's Next?</strong> The property host will review your request and respond within 24 hours.
                  You'll receive another email once your booking is confirmed.
                </div>

                <div class="booking-details">
                  <h3 style="margin-top: 0; color: #2563eb;">Reservation Details</h3>
                  <div class="detail-row">
                    <span class="label">Property:</span>
                    <span class="value">${property.name}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Location:</span>
                    <span class="value">${property.city}, ${property.state}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Check-in:</span>
                    <span class="value">${checkInDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Check-out:</span>
                    <span class="value">${checkOutDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Nights:</span>
                    <span class="value">${booking.nights}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Guests:</span>
                    <span class="value">${booking.numberOfGuests}</span>
                  </div>
                </div>

                <div class="booking-details">
                  <h3 style="margin-top: 0; color: #2563eb;">Payment Summary</h3>
                  <div class="detail-row">
                    <span class="label">Total Amount:</span>
                    <span class="value"><strong>$${parseFloat(booking.totalAmount).toFixed(2)}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Deposit (10%) - Due Now:</span>
                    <span class="value">$${parseFloat(booking.depositAmount).toFixed(2)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Balance (90%) - Due at Check-in:</span>
                    <span class="value">$${parseFloat(booking.balanceAmount).toFixed(2)}</span>
                  </div>
                </div>

                <div class="info-box">
                  <strong>💳 Payment Information:</strong><br>
                  Your card has been authorized for the deposit amount but will <strong>NOT be charged</strong> until
                  the host approves your booking request. If your request is declined, the authorization will be
                  released immediately with no charge.
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <p style="color: #6b7280;">Questions about your booking?</p>
                  <p>Confirmation Code: <strong>${booking.confirmationCode}</strong></p>
                  <p>Contact us at <a href="mailto:${FROM_EMAIL}">${FROM_EMAIL}</a></p>
                </div>

                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                  We'll notify you as soon as the host responds to your request.
                </p>
              </div>

              <div class="footer">
                <p>This is an automated confirmation from AspireTowards.<br>
                For assistance, please contact ${FROM_EMAIL}</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
BOOKING REQUEST RECEIVED

Confirmation Code: ${booking.confirmationCode}

Hi ${booking.guestName},

Thank you for your booking request at ${property.name}!

What's Next? The property host will review your request and respond within 24 hours.

Reservation Details:
- Property: ${property.name}
- Location: ${property.city}, ${property.state}
- Check-in: ${checkInDate}
- Check-out: ${checkOutDate}
- Nights: ${booking.nights}
- Guests: ${booking.numberOfGuests}

Payment Summary:
- Total Amount: $${parseFloat(booking.totalAmount).toFixed(2)}
- Deposit (10%) - Due Now: $${parseFloat(booking.depositAmount).toFixed(2)}
- Balance (90%) - Due at Check-in: $${parseFloat(booking.balanceAmount).toFixed(2)}

Payment Information: Your card has been authorized for the deposit amount but will NOT be charged
until the host approves your booking request.

Questions? Contact us at ${FROM_EMAIL}

We'll notify you as soon as the host responds to your request.
        `
      };

      await sgMail.send(msg);
      console.log(`✅ Booking request confirmation email sent to guest: ${booking.guestEmail}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending booking request email to guest:', error);
      if (error.response) {
        console.error('SendGrid error details:', error.response.body);
      }
      throw error;
    }
  }

  /**
   * Send email notification to host when a new booking request is received
   * @param {Object} booking - Booking object with all details
   * @param {Object} property - Property object
   * @param {Object} host - Host/User object
   */
  async sendBookingRequestToHost(booking, property, host) {
    try {
      const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const msg = {
        to: host.email,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        replyTo: REPLY_TO_EMAIL,
        subject: `New Booking Request for ${property.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .detail-row:last-child { border-bottom: none; }
              .label { font-weight: bold; color: #6b7280; }
              .value { color: #111827; }
              .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
              .button-decline { background: #dc2626; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
              .message-box { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 15px 0; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏠 New Booking Request</h1>
              </div>
              <div class="content">
                <p>Hi ${host.firstName || 'Host'},</p>

                <p>You have received a new booking request for <strong>${property.name}</strong>.</p>

                <div class="highlight">
                  <strong>⏰ Action Required:</strong> Please review and respond within 24 hours.
                </div>

                <div class="booking-details">
                  <h3 style="margin-top: 0; color: #2563eb;">Guest Information</h3>
                  <div class="detail-row">
                    <span class="label">Name:</span>
                    <span class="value">${booking.guestName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Email:</span>
                    <span class="value">${booking.guestEmail}</span>
                  </div>
                  ${booking.guestPhone ? `
                  <div class="detail-row">
                    <span class="label">Phone:</span>
                    <span class="value">${booking.guestPhone}</span>
                  </div>
                  ` : ''}
                  <div class="detail-row">
                    <span class="label">Number of Guests:</span>
                    <span class="value">${booking.numberOfGuests}</span>
                  </div>
                </div>

                ${booking.guestMessage ? `
                <div class="message-box">
                  <strong>Guest Message:</strong><br>
                  "${booking.guestMessage}"
                </div>
                ` : ''}

                <div class="booking-details">
                  <h3 style="margin-top: 0; color: #2563eb;">Booking Details</h3>
                  <div class="detail-row">
                    <span class="label">Property:</span>
                    <span class="value">${property.name}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Confirmation Code:</span>
                    <span class="value"><strong>${booking.confirmationCode}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Check-in:</span>
                    <span class="value">${checkInDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Check-out:</span>
                    <span class="value">${checkOutDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Nights:</span>
                    <span class="value">${booking.nights}</span>
                  </div>
                </div>

                <div class="booking-details">
                  <h3 style="margin-top: 0; color: #2563eb;">Payment Information</h3>
                  <div class="detail-row">
                    <span class="label">Total Amount:</span>
                    <span class="value"><strong>$${parseFloat(booking.totalAmount).toFixed(2)}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Deposit (10%):</span>
                    <span class="value">$${parseFloat(booking.depositAmount).toFixed(2)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Balance (90%):</span>
                    <span class="value">$${parseFloat(booking.balanceAmount).toFixed(2)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Deposit Status:</span>
                    <span class="value" style="color: #f59e0b;">Authorized (not charged yet)</span>
                  </div>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${FRONTEND_URL}/dashboard/bookings.html" class="button">
                    ✓ View in Dashboard
                  </a>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                  <strong>Note:</strong> The guest's card has been authorized for the deposit amount but
                  has not been charged yet. When you approve this booking, the deposit will be automatically
                  charged to their card.
                </p>
              </div>

              <div class="footer">
                <p>This is an automated message from RentFlow.<br>
                Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
New Booking Request for ${property.name}

Guest Information:
- Name: ${booking.guestName}
- Email: ${booking.guestEmail}
${booking.guestPhone ? `- Phone: ${booking.guestPhone}` : ''}
- Number of Guests: ${booking.numberOfGuests}

${booking.guestMessage ? `Guest Message: "${booking.guestMessage}"` : ''}

Booking Details:
- Property: ${property.name}
- Confirmation Code: ${booking.confirmationCode}
- Check-in: ${checkInDate}
- Check-out: ${checkOutDate}
- Nights: ${booking.nights}

Payment Information:
- Total Amount: $${parseFloat(booking.totalAmount).toFixed(2)}
- Deposit (10%): $${parseFloat(booking.depositAmount).toFixed(2)}
- Balance (90%): $${parseFloat(booking.balanceAmount).toFixed(2)}
- Deposit Status: Authorized (not charged yet)

Please review and respond within 24 hours by visiting your dashboard:
${FRONTEND_URL}/dashboard/bookings.html
        `
      };

      await sgMail.send(msg);
      console.log(`Booking request email sent to host: ${host.email}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending booking request email to host:', error);
      throw error;
    }
  }

  /**
   * Send confirmation email to guest when booking is approved
   * @param {Object} booking - Booking object
   * @param {Object} property - Property object
   */
  async sendBookingApprovalToGuest(booking, property) {
    try {
      const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const msg = {
        to: booking.guestEmail,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        replyTo: REPLY_TO_EMAIL,
        subject: `Booking Confirmed! ${property.name} - ${booking.confirmationCode}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .success-icon { font-size: 48px; margin-bottom: 10px; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .detail-row:last-child { border-bottom: none; }
              .label { font-weight: bold; color: #6b7280; }
              .value { color: #111827; }
              .confirmation-code { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
              .confirmation-code h2 { margin: 0; font-size: 32px; letter-spacing: 2px; }
              .highlight { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
              .payment-box { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
              .instructions { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">✓</div>
                <h1>Your Booking is Confirmed!</h1>
              </div>
              <div class="content">
                <p>Hi ${booking.guestName},</p>

                <p>Great news! Your booking request for <strong>${property.name}</strong> has been approved by the host.</p>

                <div class="confirmation-code">
                  <p style="margin: 0; font-size: 14px; opacity: 0.9;">Your Confirmation Code</p>
                  <h2>${booking.confirmationCode}</h2>
                </div>

                <div class="highlight">
                  <strong>✓ Deposit Charged:</strong> Your card has been charged $${parseFloat(booking.depositAmount).toFixed(2)} for the deposit.
                </div>

                <div class="booking-details">
                  <h3 style="margin-top: 0; color: #10b981;">Reservation Details</h3>
                  <div class="detail-row">
                    <span class="label">Property:</span>
                    <span class="value">${property.name}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Location:</span>
                    <span class="value">${property.city}, ${property.state}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Check-in:</span>
                    <span class="value">${checkInDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Check-out:</span>
                    <span class="value">${checkOutDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Nights:</span>
                    <span class="value">${booking.nights}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Guests:</span>
                    <span class="value">${booking.numberOfGuests}</span>
                  </div>
                </div>

                <div class="booking-details">
                  <h3 style="margin-top: 0; color: #10b981;">Payment Summary</h3>
                  <div class="detail-row">
                    <span class="label">Total Amount:</span>
                    <span class="value"><strong>$${parseFloat(booking.totalAmount).toFixed(2)}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Deposit Paid (10%):</span>
                    <span class="value" style="color: #10b981;">✓ $${parseFloat(booking.depositAmount).toFixed(2)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Balance Due at Check-in (90%):</span>
                    <span class="value" style="color: #f59e0b;"><strong>$${parseFloat(booking.balanceAmount).toFixed(2)}</strong></span>
                  </div>
                </div>

                <div class="payment-box">
                  <strong>💰 Payment Reminder:</strong> The remaining balance of $${parseFloat(booking.balanceAmount).toFixed(2)}
                  is due upon check-in. Please bring payment in the form of cash, card, or electronic transfer.
                </div>

                ${property.checkInInstructions ? `
                <div class="instructions">
                  <h3 style="margin-top: 0; color: #2563eb;">📋 Check-in Instructions</h3>
                  <p style="white-space: pre-line;">${property.checkInInstructions}</p>
                </div>
                ` : ''}

                ${property.houseRules ? `
                <div class="instructions">
                  <h3 style="margin-top: 0; color: #2563eb;">📜 House Rules</h3>
                  <p style="white-space: pre-line;">${property.houseRules}</p>
                </div>
                ` : ''}

                <div style="text-align: center; margin: 30px 0;">
                  <p style="color: #6b7280;">Questions or need to make changes?</p>
                  <p>Contact us at <a href="mailto:${FROM_EMAIL}">${FROM_EMAIL}</a></p>
                </div>

                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                  We look forward to hosting you!<br>
                  Save this email for your records.
                </p>
              </div>

              <div class="footer">
                <p>This is an automated confirmation from RentFlow.<br>
                For assistance, please contact ${FROM_EMAIL}</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
YOUR BOOKING IS CONFIRMED!

Confirmation Code: ${booking.confirmationCode}

Hi ${booking.guestName},

Your booking request for ${property.name} has been approved!

Deposit Charged: Your card has been charged $${parseFloat(booking.depositAmount).toFixed(2)} for the deposit.

Reservation Details:
- Property: ${property.name}
- Location: ${property.city}, ${property.state}
- Check-in: ${checkInDate}
- Check-out: ${checkOutDate}
- Nights: ${booking.nights}
- Guests: ${booking.numberOfGuests}

Payment Summary:
- Total Amount: $${parseFloat(booking.totalAmount).toFixed(2)}
- Deposit Paid (10%): $${parseFloat(booking.depositAmount).toFixed(2)}
- Balance Due at Check-in (90%): $${parseFloat(booking.balanceAmount).toFixed(2)}

Payment Reminder: The remaining balance of $${parseFloat(booking.balanceAmount).toFixed(2)} is due upon check-in.

${property.checkInInstructions ? `Check-in Instructions:\n${property.checkInInstructions}\n\n` : ''}
${property.houseRules ? `House Rules:\n${property.houseRules}\n\n` : ''}

Questions? Contact us at ${FROM_EMAIL}

We look forward to hosting you!
        `
      };

      await sgMail.send(msg);
      console.log(`Booking approval email sent to guest: ${booking.guestEmail}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending booking approval email to guest:', error);
      throw error;
    }
  }

  /**
   * Send decline notification to guest when booking is declined
   * @param {Object} booking - Booking object
   * @param {Object} property - Property object
   * @param {string} reason - Reason for decline
   */
  async sendBookingDeclineToGuest(booking, property, reason) {
    try {
      const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const msg = {
        to: booking.guestEmail,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        replyTo: REPLY_TO_EMAIL,
        subject: `Booking Update - ${property.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #6b7280; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .detail-row:last-child { border-bottom: none; }
              .label { font-weight: bold; color: #6b7280; }
              .value { color: #111827; }
              .reason-box { background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
              .highlight { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Booking Update</h1>
              </div>
              <div class="content">
                <p>Hi ${booking.guestName},</p>

                <p>We're sorry to inform you that your booking request for <strong>${property.name}</strong>
                could not be confirmed at this time.</p>

                <div class="highlight">
                  <strong>💳 No Charge:</strong> Your card authorization has been released. You have not been charged.
                </div>

                <div class="booking-details">
                  <h3 style="margin-top: 0; color: #6b7280;">Booking Details</h3>
                  <div class="detail-row">
                    <span class="label">Property:</span>
                    <span class="value">${property.name}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Location:</span>
                    <span class="value">${property.city}, ${property.state}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Confirmation Code:</span>
                    <span class="value">${booking.confirmationCode}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Check-in:</span>
                    <span class="value">${checkInDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Check-out:</span>
                    <span class="value">${checkOutDate}</span>
                  </div>
                </div>

                ${reason ? `
                <div class="reason-box">
                  <strong>Host's Message:</strong><br>
                  <p style="margin: 10px 0 0 0; white-space: pre-line;">${reason}</p>
                </div>
                ` : ''}

                <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #2563eb;">Explore Other Properties</h3>
                  <p>We have many other beautiful properties available for your dates.
                  We'd love to help you find the perfect place for your stay!</p>

                  <div style="text-align: center;">
                    <a href="${FRONTEND_URL}/properties.html" class="button">
                      Browse Available Properties
                    </a>
                  </div>
                </div>

                <p style="text-align: center; margin-top: 30px;">
                  Need assistance finding another property?<br>
                  Contact us at <a href="mailto:${FROM_EMAIL}">${FROM_EMAIL}</a>
                </p>
              </div>

              <div class="footer">
                <p>This is an automated message from RentFlow.<br>
                For assistance, please contact ${FROM_EMAIL}</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
BOOKING UPDATE

Hi ${booking.guestName},

We're sorry to inform you that your booking request for ${property.name} could not be confirmed at this time.

No Charge: Your card authorization has been released. You have not been charged.

Booking Details:
- Property: ${property.name}
- Location: ${property.city}, ${property.state}
- Confirmation Code: ${booking.confirmationCode}
- Check-in: ${checkInDate}
- Check-out: ${checkOutDate}

${reason ? `Host's Message:\n${reason}\n\n` : ''}

We have many other beautiful properties available for your dates.
Browse available properties: ${FRONTEND_URL}/properties.html

Need assistance? Contact us at ${FROM_EMAIL}
        `
      };

      await sgMail.send(msg);
      console.log(`Booking decline email sent to guest: ${booking.guestEmail}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending booking decline email to guest:', error);
      throw error;
    }
  }

  /**
   * Send balance payment reminder to guest
   * @param {Object} booking - Booking object
   * @param {Object} property - Property object
   * @param {number} daysUntilCheckIn - Days until check-in
   */
  async sendBalanceReminderToGuest(booking, property, daysUntilCheckIn) {
    try {
      const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const msg = {
        to: booking.guestEmail,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        replyTo: REPLY_TO_EMAIL,
        subject: `Payment Reminder: Balance Due for ${property.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .payment-box { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; text-align: center; }
              .amount { font-size: 36px; font-weight: bold; color: #f59e0b; margin: 10px 0; }
              .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .detail-row:last-child { border-bottom: none; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💰 Payment Reminder</h1>
              </div>
              <div class="content">
                <p>Hi ${booking.guestName},</p>

                <p>Your stay at <strong>${property.name}</strong> is coming up in <strong>${daysUntilCheckIn} days</strong>!</p>

                <div class="payment-box">
                  <p style="margin: 0;">Balance Due at Check-in</p>
                  <div class="amount">$${parseFloat(booking.balanceAmount).toFixed(2)}</div>
                  <p style="margin: 10px 0 0 0; font-size: 14px;">Please bring payment upon arrival</p>
                </div>

                <div class="booking-details">
                  <h3 style="margin-top: 0;">Your Reservation</h3>
                  <div class="detail-row">
                    <span style="font-weight: bold;">Confirmation Code:</span>
                    <span>${booking.confirmationCode}</span>
                  </div>
                  <div class="detail-row">
                    <span style="font-weight: bold;">Check-in:</span>
                    <span>${checkInDate}</span>
                  </div>
                  <div class="detail-row">
                    <span style="font-weight: bold;">Property:</span>
                    <span>${property.name}</span>
                  </div>
                </div>

                <p>We look forward to welcoming you soon!</p>
              </div>

              <div class="footer">
                <p>Questions? Contact us at ${FROM_EMAIL}</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
PAYMENT REMINDER

Hi ${booking.guestName},

Your stay at ${property.name} is coming up in ${daysUntilCheckIn} days!

Balance Due at Check-in: $${parseFloat(booking.balanceAmount).toFixed(2)}

Reservation Details:
- Confirmation Code: ${booking.confirmationCode}
- Check-in: ${checkInDate}
- Property: ${property.name}

Please bring payment upon arrival.

Questions? Contact us at ${FROM_EMAIL}
        `
      };

      await sgMail.send(msg);
      console.log(`Balance reminder email sent to guest: ${booking.guestEmail}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending balance reminder email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
