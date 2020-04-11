const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const {sendgridKey} = require('../config/secrets.json');

exports.transport = nodemailer.createTransport( sendgridTransport({
    auth:{
        api_key: sendgridKey
    }
}))