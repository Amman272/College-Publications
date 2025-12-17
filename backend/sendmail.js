import nodemailer from "nodemailer";

export async function sendEmail(to,subject,html){
    const transporter= nodemailer.createTransport({
        service:"gmail",
        auth:{
            user: process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASSWORD,
        },
    });
    const mailoptions={
        from:process.env.EMAIL_USER,
        to,
        subject,
        html,
    };
    await transporter.sendMail(mailoptions);
}