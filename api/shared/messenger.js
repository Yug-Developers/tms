const axios = require('axios');
const Config = require('../Config')


module.exports = {
    sendSms({ phone, message, token, alpha_name, tag }) {
        return axios({
            method: 'POST',
            url: Config.messengerMs.url + '/sendsms',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            data: {
                phone,
                message,
                alpha_name: alpha_name || Config.messengerMs.alphaName,
                tag: tag || Config.messengerMs.tag
            }
        })
    },
    async sendMail({ to, from, cc, subject, text, html, attachments, token }) {
        const debugEmail = Config.debugEmail
        let subjectSufix = ''
        if (debugEmail && process.env.NODE_ENV !== 'production') {
            subjectSufix = ` (${to})`
            to = debugEmail
            cc = Config.defaultManagerEmail
        }
        try {
            const resp = await axios({
                method: 'POST',
                url: Config.messengerMs.url + '/sendmail',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                data: {
                    to,
                    from,
                    cc,
                    subject: subject + subjectSufix,
                    text,
                    html,
                    alpha_name: Config.messengerMs.alphaName,
                    attachments
                }
            })
            return resp
        } catch (e) {
            throw new Error('Помилка відправки Email' + e)
        }
    }
}