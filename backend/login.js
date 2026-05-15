import { Router } from "express";
import { db } from "./db.js"; // Add import


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
    body { margin:0; padding:0; background-color:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    table { border-collapse: collapse; }
    
    .outer { width:100%; background-color:#f1f5f9; padding:60px 20px; }
    .card { max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08); }

    .header { padding:32px 32px 28px; background:#ffffff; border-bottom:2px solid #2563eb; text-align:center; }
    .header-title { font-size:20px; font-weight:600; color:#1e40af; }
    
    .body { padding:40px 36px; color:#1a1a1a; }
    .greeting { font-size:16px; margin-bottom:8px; color:#1a1a1a; }
    .explain { font-size:14px; color:#666666; margin-bottom:28px; line-height:1.5; }

    .otp-container { text-align:center; margin:28px 0; }
    .otp-box { display:inline-block; background:#eff6ff; border:2px solid #3b82f6; padding:18px 36px; border-radius:6px; }
    .otp { font-size:32px; letter-spacing:10px; font-weight:700; color:#1e40af; }
    .otp-hint { font-size:13px; color:#64748b; margin-top:16px; }

    .footer { padding:28px 36px; background:#f8fafc; border-top:2px solid #e0e7ff; text-align:center; font-size:13px; color:#64748b; }

    @media only screen and (max-width:480px){
      .outer { padding:24px 16px; }
      .body { padding:32px 24px; }
      .header { padding:24px 20px 20px; }
      .footer { padding:24px 24px; }
      .otp { font-size:28px; letter-spacing:8px; }
      .otp-box { padding:16px 28px; }
    }
  </style>
</head>
<body>
  <table class="outer" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table class="card" cellpadding="0" cellspacing="0" role="presentation">

          <tr>
            <td class="header">
              <div class="header-title">NRI Institute of Technology</div>
            </td>
          </tr>

          <tr>
            <td class="body">
              <div class="greeting">Hi there,</div>
              <div class="explain">Use this code to verify your account.</div>

              <div class="otp-container">
                <div class="otp-box">
                  <div class="otp">{{OTP}}</div>
                </div>
                <div class="otp-hint">Keep this code private</div>
              </div>
            </td>
          </tr>

          <tr>
            <td class="footer">
              NRI Institute of Technology
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

    await sendEmail(email, "OTP for NRI publications portal", finalHTMLContent);
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

router.post("/otpVerify", async (req, res) => {
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

    // Log login action
    try {
      await db.query("INSERT INTO audit_logs (user_email, action, details) VALUES (?, ?, ?)", [email, "LOGIN", "User logged in via OTP"]);
    } catch (e) {
      console.error("Login log failed", e);
    }

    return res
      .status(200)
      .json({ message: "OTP verified successfully!", token: token });
  } else {
    console.log(otpStore[email]);
    return res.status(401).json({ message: "Invalid OTP." });
  }
});

export default router;
