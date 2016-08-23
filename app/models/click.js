var db = require('../config'); //bookshelf
var Link = require('./link.js');

var Click = db.Model.extend({
  tableName: 'clicks',
  hasTimestamps: true,
  link: function() {
    return this.belongsTo(Link, 'linkId'); //belongsTo is a bookshelf method, assign linkId to Link table as a foreign id
  }
});

module.exports = Click;
