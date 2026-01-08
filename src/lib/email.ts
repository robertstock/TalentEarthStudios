export async function sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `http://localhost:3000/auth/reset-password?token=${token}`;

    console.log("========================================");
    console.log("📧 MOCK EMAIL SERVICE: Password Reset");
    console.log(`To: ${email}`);
    console.log(`Link: ${resetLink}`);
    console.log("========================================");

    // In a real app, you would use a provider like Resend, SendGrid, or nodemailer here.
}
