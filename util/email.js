const nodemailer = require('nodemailer');




const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
    }
});
const sendEmailTo = (email) => {
    console.log(email)
    const mailOptions = {
        from: 'NOREPLY-FURUMA@furuma.ltd.com',
        to: `${email}`,
        subject: 'Password recovery',
        text: `Please click the link if you want to reset your password. `
            +
            process.env.RECOVERY_LINK
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent');
        }
    });
}

module.exports = sendEmailTo;

