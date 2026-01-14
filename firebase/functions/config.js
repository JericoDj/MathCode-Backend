const functions = require("firebase-functions");

module.exports = {
  emailUser: functions.config().gmail.user,
  emailPass: functions.config().gmail.pass,
  supportEmail: functions.config().gmail.support || functions.config().gmail.user
};