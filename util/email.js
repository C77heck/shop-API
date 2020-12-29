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
        from: 'A.u.r.u.m.a.0.0@gmail.com',
        to: `${email}`,
        subject: 'Password recovery',
        text: `Please click on the recovery link `
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

