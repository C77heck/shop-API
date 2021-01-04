const nodemailer = require('nodemailer');




const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
    }
});
const recoveryMessage = (email, requestId, name) => {
    const mailOptions = {
        from: 'NOREPLY-FURUMA@furuma.ltd.com',
        to: `${email}`,
        subject: 'Password recovery',
        html: `<h3>Dear ${name},</h3>
        <p>To reset your Furuma account password please </p>
        <a href=${process.env.RECOVERY_LINK}${requestId}>click here</a>
        <p>Sincerely,</p>
        <p>Furuma team</p>`

    };

    transporter.sendMail(mailOptions, function (error) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent');
        }
    });

    return true;
}



const orderConfirmation = (email, name, date) => {
    const mailOptions = {
        from: 'NOREPLY-FURUMA@furuma.ltd.com',
        to: `${email}`,
        subject: 'order confirmation',
        html: `<h3>Dear ${name},</h3>
        <p>Thank you for your purchase, ${name}.</p>
        <p>Your order is confirmed</p>
        <p>We will deliver your order on ${date}</p>
        <p>Sincerely,</p>
        <p>Furuma team</p>`
    };

    transporter.sendMail(mailOptions, function (error) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent');
        }
    });
}

exports.recoveryMessage = recoveryMessage;
exports.orderConfirmation = orderConfirmation;

