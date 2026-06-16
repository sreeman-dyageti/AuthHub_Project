import nodemailer from "nodemailer";


    console.log(process.env.EMAIL_USER);
    console.log(process.env.EMAIL_PASSWORD);
const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASSWORD
    }
});

export const sendVerificationEmail = async ( email, verificationToken) => {
   const verificationUrl =`http://192.168.68.108:8080/v1/auth/verify-email?token=${verificationToken}`;

  await transporter.sendMail({
    from:`"AuthHub" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email",
    html: `<h2>Welcome to AuthHub</h2>
           <p>Please verify your email:</p>
           <a href="${verificationUrl}">Verify Email</a>
            <p>This link expires in 15 minutes.</p>`
  });
};