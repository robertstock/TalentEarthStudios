export async function sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password?token=${token}`;
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;

    // Log for debugging
    console.log("========================================");
    console.log("📧 EMAIL SERVICE: Password Reset");
    console.log(`To: ${email}`);
    console.log(`Link: ${resetLink}`);

    if (!webhookUrl) {
        console.warn("⚠️ MAKE_WEBHOOK_URL is not defined in .env. Email will NOT be sent to Make.com.");
        console.log("========================================");
        return;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "PASSWORD_RESET",
                email,
                resetLink,
                timestamp: new Date().toISOString()
            }),
        });

        if (!response.ok) {
            console.error(`Failed to send email webhook: ${response.status} ${response.statusText}`);
        } else {
            console.log("✅ Webhook sent to Make.com successfully");
        }
    } catch (error) {
        console.error("Error sending email webhook:", error);
    }
    console.log("========================================");
}
