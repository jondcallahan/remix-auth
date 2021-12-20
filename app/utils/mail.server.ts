import nodemailer, { Transporter } from "nodemailer";
import invariant from "tiny-invariant";
import { createVerifyEmailLink } from "./auth/verifyEmail.server";

export async function getEmailTransporter() {
  try {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  } catch (error) {
    console.error("error", error);
  }
}

export async function sendEmail(
  transporter: Transporter,
  { from = "🏄@example.com", to = "🚀@example.com", subject = "", html = "" }
) {
  try {
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log("////////////////////////////////////");

    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    console.log("////////////////////////////////////");
  } catch (error) {
    console.error("error", error);
  }
}

export async function sendVerificationEmail(email: string) {
  const verifyLink = await createVerifyEmailLink(email);
  const mailer = await getEmailTransporter();
  invariant(!!mailer);

  return await sendEmail(mailer, {
    to: email,
    subject: "Verify your email",
    html: `<a href="${verifyLink}">Verify</a>`,
  });
}

export async function sendForgotPasswordEmail(email: string, token: string) {
  const mailer = await getEmailTransporter();
  invariant(!!mailer);

  return await sendEmail(mailer, {
    to: email,
    subject: "Password reset link",
    html: `<a href="http://localhost:3000/auth/forgot-password/${token}">Reset password</a><br /><p>Note: this link will expire in 24 hours</p>`,
  });
}
