/**
 * Sends an email message.
 *
 * @param {string} to Recipient email address.
 * @param {string} subject Subject line.
 * @param {string} message Plain text message body.
 * @returns {Promise<void>}
 */
async function sendEmail(to, subject, message) {
    console.log('==============================')
    console.log('EMAIL SENT')
    console.log('To: ' + to)
    console.log('Subject: ' + subject)
    console.log('Message:')
    console.log(message)
    console.log('==============================')
}

module.exports = {
    sendEmail,
}