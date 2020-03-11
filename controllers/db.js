const admin = require('firebase-admin');
let {SQL_USER, SQL_PASSWORD, SQL_DATABASE, INSTANCE_CONNECTION_NAME} = require('../config/db');
let {Sequelize} = require('sequelize');

let serviceAccount = require('../service/service_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const config = {
  user: process.env.SQL_USER || SQL_USER,
  database: process.env.SQL_DATABASE || SQL_DATABASE,
  password: process.env.SQL_PASSWORD || SQL_PASSWORD,
  //replace socketpath with the line below before deploying to app engine.
  //host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME || INSTANCE_CONNECTION_NAME}`
  //host: "34.93.249.229"
  host: 'localhost',
  port: 8080,

}
exports.sequelize = new Sequelize(config.database, config.user, config.password,{
  host: config.host,
  port: config.port,
  dialect: 'mysql',
  //Uncomment the lines below before deploying onto app engine
  // timestamps: false,
  // dialectOptions: {
  //     socketPath: config.socketPath
  // },
});

exports.Sequelize = Sequelize

exports.db = admin.firestore();