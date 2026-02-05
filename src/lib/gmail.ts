export interface SendEmailParams {
    to: string;
    subject: string;
    body: string;
    token: string;
}

/**
 * Sends an email using the Gmail API (Client-side).
 * Requires the 'https://www.googleapis.com/auth/gmail.send' scope.
 */
export async function sendGmail({ to, subject, body, token }: SendEmailParams) {
    // 1. Construct the MIME message
    // Note: We use a simple structure. For rich text, we would need a multipart MIME.
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const messageParts = [
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=utf-8",
        "Content-Transfer-Encoding: 7bit",
        "",
        body,
    ];

    const message = messageParts.join("\n");

    // 2. Encode the message as Base64URL (RFC 4648)
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    // 3. Send via Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            raw: encodedMessage,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to send email via Gmail API');
    }

    return await response.json();
}
