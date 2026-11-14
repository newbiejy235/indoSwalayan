import transporter from "../config/mailer";

interface SendOtpEmailProps {
  email: string;
  otp: string;
}

export const sendOtpEmail = async ({
  email,
  otp,
}: SendOtpEmailProps) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Reset Password - POS System",

    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="
            max-width: 500px;
            margin: auto;
            padding: 25px;
            border: 1px solid #ddd;
            border-radius: 10px;
          ">
            <h2>Reset Password</h2>

            <p>
              Kami menerima permintaan untuk mereset
              password akun POS System kamu.
            </p>

            <p>Kode OTP kamu:</p>

            <h1 style="
              letter-spacing: 10px;
              text-align: center;
              color: #2563eb;
            ">
              ${otp}
            </h1>

            <p>
              Kode ini berlaku selama
              ${process.env.OTP_EXPIRES_MINUTES || 5} menit.
            </p>

            <p>
              Jangan berikan kode ini kepada siapa pun.
            </p>

            <small>
              Jika kamu tidak meminta reset password,
              abaikan email ini.
            </small>
          </div>
        </body>
      </html>
    `,
  });
};