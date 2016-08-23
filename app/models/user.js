var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Link = require('./link.js');
var Promise = require('bluebird');



var User = db.Model.extend({
  tablenames: 'users',
  hasTimestamps: true,
  links: function() {
    return this.hasMany(Link);
  }
});

module.exports = User;