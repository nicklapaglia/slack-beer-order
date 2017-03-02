const API_TOKEN = 'xoxb-63811727463-1qpLQSyKGeMTbN1nsbRBFzkl'
/*const status = 'CTA train status for '
const link = 'For more info see <http://www.transitchicago.com/alerts/|here>'
const metraKey = "8acff6fcebbf304168a9a97e971992c1"
const metraSecret = "f143ff2fce1e15928360cde99e79ea9a"
const metraLink = 'For more info see <https://metrarail.com/riding-metra/service-updates|here>'
*/
var Botkit = require('botkit');
var http = require('http');
var https = require('https');
//var striptags = require('striptags');
//var entities = require("entities");

var botReturn;
var messReturn;

var optionsCTA = {
   host: 'www.transitchicago.com',
   path: '/api/1.0/routes.aspx?routeid=red,blue,brn,g,org,p,pexp,pink,y&outputType=JSON'
};

var optionsMetra = {
 host: 'gtfsapi.metrarail.com',
 path: '/gtfs/alerts',
 headers: { "Authorization": "Basic " + new Buffer(metraKey + ":" + metraSecret, "utf8").toString("base64") }

};

var controller = Botkit.slackbot({
   debug: false
});

// connect the bot to a stream of messages
controller.spawn({
   token: API_TOKEN,
}).startRTM()

// give the bot something to listen for
controller.hears('BeerList', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
   bot.reply(message, "hi");
   botReturn = bot;
   messReturn = message;
   //http.request(optionsCTA, callback).end();
   //https.request(optionsMetra, callbackMetra).end();
});

/*callback = function(response) {
   var str = '';

   response.on('data', function(chunk) {
       str += chunk;
   });

   response.on('end', function() {
       var obj = JSON.parse(str);
       var strReturn = '';
       strReturn = status + obj.CTARoutes.TimeStamp + '\n';
       for (var i = 0; i < obj.CTARoutes.RouteInfo.length; i++) {
           strReturn += obj.CTARoutes.RouteInfo[i].Route + ': ' + obj.CTARoutes.RouteInfo[i].RouteStatus + '\n'
       }
       console.log(strReturn)
       strReturn += link
       var objReturn = {
           text: strReturn,
           'mrkdwn': true,
           'unfurl_links': false
       }
       botReturn.reply(messReturn, objReturn);
   });
}*/

/*callbackMetra = function(response) {
   var str = '';
   response.on('data', function(chunk) {
       str += chunk;
   });

   response.on('end', function() {
       var obj = JSON.parse(str);
       var header = ''
       var strReturn = '';
       for (var i = 0; i < obj.length; i++) {
           header = obj[i].alert.header_text.translation[0].text;
           header = striptags(header);
           strReturn += header + '\n';
           console.log(header);
       }
       strReturn += metraLink;
       var objReturn = {
           text: strReturn,
           'mrkdwn': true,
           'unfurl_links': false
       }
       botReturn.reply(messReturn, objReturn);
   });
}*/



