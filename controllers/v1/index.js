'use strict'

const User = require('./User');
const Forgot= require('./Forgot');
const Assets= require('./Assets');
const Log= require('./Log');
const Access= require('./Access');
const Liability= require('./Liability');
const Paystack = require('./Paystack');
const Subscription = require('./Subscription');
const UserGroup = require('./UserGroup')

module.exports = {
User,
Forgot,
Assets,
Log,
Access,
Paystack,
Liability,
Subscription, 
UserGroup
}