const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = async (email, name) => {
    try {
        await sgMail.send({
            to: email,
            from: 'dev.briggs.victoria@gmail.com',
            subject: 'Thanks for joining in!',
            text: `Welcome to the app, ${name}. Let me know how you get along with the app.`,
        })
        console.log('Email sent')
    } catch (e) {
        console.log(e)
    }
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