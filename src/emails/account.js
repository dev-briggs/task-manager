const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'dev.briggs.victoria@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`,
        // html: '<strong></strong>',
    }).then(() => {
        console.log('Email sent')
    }).catch((error) => {
        console.error(error)
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'dev.briggs.victoria@gmail.com',
        subject: `We're sad to see you go.`,
        text: `Goodbye, ${name}. Is there anything we could have done to have kept you on board?`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail,
}