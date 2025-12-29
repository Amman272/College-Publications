import { Router } from "express";
import { sendEmail } from "./sendmail.js";
import jwt from "jsonwebtoken";
const router = Router();
const otpStore = {};
const expiryTime = 5 * 60 * 1000;
router.post("/otpSend", async (req, res) => {
  try {
    let { email } = req.body;
    email = email.toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000);
    // const otp = 0;
    //console.log(otp);
    const otpstr = otp.toString();
    otpStore[email] = {
      code: otpstr,
      expiry: Date.now() + expiryTime,
    };
    const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OTP Email</title>
  <style>
    /* General resets */
    body { margin:0; padding:0; background-color:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    table { border-collapse: collapse; }
    img { border:0; display:block; }

    /* Container */
    .outer { width:100%; background-color:#f3f4f6; padding:32px 16px; }
    .card { max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 18px rgba(16,24,40,0.08); }

    /* Header */
    .header { padding:24px; background:linear-gradient(90deg,#4f46e5,#06b6d4); color:#fff; text-align:center; }
    .logo { width:48px; height:48px; border-radius:10px; background:rgba(255,255,255,0.12); display:inline-block; line-height:48px; vertical-align:middle; }
    .title { font-size:20px; font-weight:700; margin-top:12px; }

    /* Body */
    .body { padding:28px 30px; color:#0f172a; }
    .greeting { font-size:16px; margin-bottom:8px; }
    .explain { font-size:14px; color:#475569; margin-bottom:20px; line-height:1.5; }

    /* OTP box */
    .otp-wrap { text-align:center; margin:20px 0; }
    .otp { display:inline-block; background:linear-gradient(180deg,#f8fafc,#ffffff); border:1px solid #e6edf3; padding:18px 26px; border-radius:12px; font-size:28px; letter-spacing:6px; font-weight:700; color:#0f172a; }
    .sub { font-size:13px; color:#64748b; margin-top:8px; }

    /* Button */
    .btn { display:block; width:100%; text-align:center; padding:12px 16px; border-radius:10px; text-decoration:none; font-weight:700; }
    .btn-primary { background:linear-gradient(90deg,#4f46e5,#06b6d4); color:#fff; }
    .btn-link { display:inline-block; margin-top:12px; color:#4f46e5; text-decoration:none; font-weight:600; }

    /* Footer */
    .footer { padding:20px 30px; font-size:12px; color:#94a3b8; text-align:center; }

    /* Mobile */
    @media only screen and (max-width:420px){
      .body { padding:20px; }
      .otp { font-size:24px; padding:14px 20px; letter-spacing:5px; }
      .header { padding:18px; }
    }
  </style>
</head>
<body>
  <table class="outer" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table class="card" cellpadding="0" cellspacing="0" role="presentation">

          <!-- Header -->
          <tr>
            <td class="header">
              <div style="display:flex;align-items:center;justify-content:center;gap:12px;flex-direction:column;">
                <div class="logo" aria-hidden="true">
                  <!-- small SVG logo -->
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin:auto;display:block;">
                    <rect x="2" y="2" width="20" height="20" rx="6" fill="white" opacity="0.06"/>
                    <path d="M7 12h10M12 7v10" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div style="text-align:center;">
                  <div style="font-size:18px;font-weight:700;">Your Service Name</div>
                  <div style="font-size:13px;opacity:0.95;margin-top:4px;">One-time passcode</div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="body">
              <div class="greeting">Hi there,</div>
              <div class="explain">We received a request to access your account. Enter the one-time passcode below to continue..</div>

              <div class="otp-wrap" role="presentation" aria-hidden="false">
                <!-- Display OTP: replace {{OTP}} with actual code -->
                <div class="otp">{{OTP}}</div>
                <div class="sub">Tip: Do not share this code with anyone.</div>
              </div>

              <!-- Call to action (optional) -->
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td>
                    <a href="{{VERIFICATION_LINK}}" class="btn btn-primary" target="_blank" rel="noreferrer noopener">Verify your account</a>
                  </td>
                </tr>
              </table>

              <div style="margin-top:18px;font-size:13px;color:#64748b;">Can't click the button? Copy and paste the following URL into your browser:</div>
              <div style="word-break:break-all;font-size:12px;color:#475569;margin-top:6px;">{{VERIFICATION_LINK}}</div>

              <div style="margin-top:18px;font-size:13px;color:#64748b;">If you did not request this, you can safely ignore this email or <a href="mailto:{{SUPPORT_EMAIL}}" style="color:#4f46e5;text-decoration:none;">contact support</a>.</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer">
            
              <div style="margin-top:8px;">If you have trouble, email <a href="mailto:{{SUPPORT_EMAIL}}" style="color:inherit;text-decoration:underline;">{{SUPPORT_EMAIL}}</a></div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
    // Change:
    // const finalHTMLContent = htmlContent.replace("{{OTP}}", otp);

    // To this if you had multiple {{OTP}} placeholders:
    const finalHTMLContent = htmlContent.replace(/{{OTP}}/g, otp);

    await sendEmail(email, "your OTP code", finalHTMLContent);
    console.log(otp);
    res.status(200).json({ message: "OTP sent successfully!" });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "error sending mail",
      error: e.message,
    });
  }
});

router.post("/otpVerify", (req, res) => {
  let { email, otp } = req.body;
  email = email.toLowerCase();
  const storedData = otpStore[email];
  if (!storedData) {
    return res.status(400).json({ message: "no otp found" });
  }

  if (Date.now() > storedData.expiry) {
    delete otpStore[email]; // Clean up expired OTP
    return res
      .status(400)
      .json({ message: "OTP has expired. Request a new one." });
  }
  // 3. Compare the codes
  if (otp === storedData.code) {
    console.log("done");
    delete otpStore[email];
    const payload = {
      userEmail: email,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
   // console.log(token);

    return res
      .status(200)
      .json({ message: "OTP verified successfully!", token: token });
  } else {
    console.log(otpStore[email]);
    return res.status(401).json({ message: "Invalid OTP." });
  }
});

export default router;
