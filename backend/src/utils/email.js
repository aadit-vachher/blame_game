const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.SMTP_FROM;

if (!apiKey || !senderEmail) {
  console.warn('[EMAIL] WARNING: Brevo email configuration is incomplete. Mails will not be sent.');
} else {
  console.log('[EMAIL] Brevo REST API transport configured successfully');
}

/**
 * Send an email asynchronously in the background (non-blocking) via Brevo REST API
 * @param {Object} options
 * @param {string} options.to - Recipient email addresses (comma separated)
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML format content
 */
function sendEmailBackground({ to, subject, text, html }) {
  if (!apiKey || !senderEmail) {
    console.warn('[EMAIL] Cannot send email. Brevo configuration is incomplete.');
    return;
  }

  // Parse comma-separated emails into Brevo recipient array format: [{ email: "..." }]
  const recipients = to.split(',').map((emailStr) => ({
    email: emailStr.trim()
  }));

  if (recipients.length === 0) return;

  // We do NOT return a promise or await the fetch request, ensuring it is non-blocking for HTTP API requests
  fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: 'Blame Game',
        email: senderEmail
      },
      to: recipients,
      subject: subject,
      htmlContent: html,
      textContent: text
    })
  })
  .then(async (response) => {
    if (response.ok) {
      const data = await response.json();
      console.log(`[EMAIL] Sent successfully via REST API to [${to}]. MsgID: ${data.messageId || 'N/A'}`);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[EMAIL] Failed to send email via REST API to [${to}]. Status: ${response.status}. Error:`, errorData);
    }
  })
  .catch((err) => {
    console.error(`[EMAIL] Fetch network error when sending email to [${to}]:`, err.message);
  });
}

module.exports = { sendEmailBackground };
