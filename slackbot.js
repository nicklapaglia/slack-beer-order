const API_TOKEN = 'xoxb-63811727463-1qpLQSyKGeMTbN1nsbRBFzkl'
var Botkit = require('botkit');
var http = require('http');
var https = require('https');
var speak = require('speakeasy-nlp');
const querystring = require('querystring');

var botReturn;
var messReturn;

var BeerOrderOptions = {
    host: '8iy9y7o9fc.execute-api.us-east-1.amazonaws.com',
    path: '/prod/wish-list'
}
var BeerAvailableOptions = {
    host: '8iy9y7o9fc.execute-api.us-east-1.amazonaws.com',
    path: '/prod/available-beers'
}
var BeerPrevOrderOptions = {
    host: '8iy9y7o9fc.execute-api.us-east-1.amazonaws.com',
    path: '/prod/beer-order'
}


var controller = Botkit.slackbot({
   debug: false
});

// connect the bot to a stream of messages
controller.spawn({
   token: API_TOKEN,
}).startRTM()

// give the bot something to listen for
controller.hears('wish list', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
   botReturn = bot;
   messReturn = message;
   https.request(BeerOrderOptions, getBeerOrder).end();
});
controller.hears('most likes', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
   botReturn = bot;
   messReturn = message;
   https.request(BeerOrderOptions, getMostLikedBeer).end();
});
controller.hears('available', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
  //** currently message must be in the form of (what {beer_style} are available).
   botReturn = bot;
   messReturn = message;
   var text = message.text;
   getAvailableBeersByStyle(text);
});
controller.hears('styles', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
   botReturn = bot;
   messReturn = message;
   https.request(BeerAvailableOptions, stylesAvailable).end();
});
controller.hears('current beer order', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
   botReturn = bot;
   messReturn = message;
   https.request(BeerPrevOrderOptions, getCurrentOrder).end();
});

controller.hears('most consumed', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
   botReturn = bot;
   messReturn = message;
   https.request(BeerPrevOrderOptions, getMostConsumedBeer).end();
});

controller.hears('total beers consumed', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
   botReturn = bot;
   messReturn = message;
   https.request(BeerPrevOrderOptions, getTotalConsumed).end();
});

controller.hears('check inventory', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
   botReturn = bot;
   messReturn = message;
   https.request(BeerPrevOrderOptions, getBeerInventory).end();
});





var getBeerOrder = function(response){
   var beerString = '';
   response.on('data', function(stuff) {
      beerString += stuff;
    });

   response.on('end', function() {

        var beers = JSON.parse(beerString);
        for (var j = 0; j< beers.length; j++){
          if(beers[j].likes.N === undefined){
            beers[j].likes.N = '1';
          }
        }
        var sortedBeers = beers.sort(function(obj1, obj2) {
          return obj2.likes.N - obj1.likes.N;
        });

        var beerNames = [];
        for(var i = 0; i<sortedBeers.length;i++){
          var name = sortedBeers[i].name.S + " - ";
          if(sortedBeers[i].likes != undefined){
            for(var j = 0; j < sortedBeers[i].likes.N; j++){
              name += " :beer:";
            }
          }
          beerNames.push(name);
        }
            
        var objReturn = {
            text: "*The following beers are on the wish list:* \n" + beerNames.join('\n'),
            'mrkdwn': true,
            'unfurl_links': false
        }
          botReturn.reply(messReturn, objReturn);
    });
   
}


var getMostLikedBeer = function(response){
  var beerString = '';
   response.on('data', function(stuff) {
      beerString += stuff;
   });

    response.on('end', function() {

        var beers = JSON.parse(beerString);

        // get highest number of likes
        var mostLikes = 0;
        for(var i = 0; i<beers.length;i++){
            if(beers[i].likes != undefined){
              if(parseInt(beers[i].likes.N) > mostLikes){
                  mostLikes = beers[i].likes.N;
              }
            }
        }

        // add most liked to list
        var mostRequested = [];
        for(var i = 0; i<beers.length;i++){
          if(beers[i].likes != undefined){
            if(beers[i].likes.N === mostLikes){
                mostRequested.push(beers[i].name.S)
            }
          }
        }

        var qualifyString = '';
        if(mostRequested.length > 1){
          qualifyString = " are currently the most liked beers."
        }else{
          qualifyString = " is currently the most liked beer."
        }

        var outputString = '';
        for(var i = 0; i< mostRequested.length; i++){
          
          if(i == mostRequested.length - 2){
            mostRequested[i] = mostRequested[i]+", and ";
          }
          else if(i == mostRequested.length - 1){
            mostRequested[i] = mostRequested[i];
          }else{
            mostRequested[i] = mostRequested[i] + ", ";
          }
        }

        var objReturn = {
          text: mostRequested.join(" ") + qualifyString,
          'mrkdwn': true,
          'unfurl_links': false
        }

          botReturn.reply(messReturn, objReturn);
  });

}

function getAvailableBeersByStyle (messageText){

  var regex = /\S* ([\S*\s*]*)\sare/;
  var match = regex.exec(messageText);
  var styleMatch = '';
  if(match){
    styleMatch = match[1];
    if(styleMatch.charAt( styleMatch.length-1 ) === 's'){
        styleMatch = styleMatch.slice(0,-1);
    } 
  }
  
  
  var qs = querystring.stringify({ tableName: 'availableBeers', style: styleMatch});

  var BeerOrderOptions = {
    host: '8iy9y7o9fc.execute-api.us-east-1.amazonaws.com',
    path: '/prod/beers-by-style'+'?'+qs
  }

  
 https.request(BeerOrderOptions, processStyleList).end();

}

var processStyleList = function(response){

  var beerString = '';
   response.on('data', function(stuff) {
      beerString += stuff;
   });

   response.on('end', function() {
      var beerNames = [];
      
      var beers = JSON.parse(beerString);
      if(beers.length > 0){
        var beerStyle = beers[0].style.S;
      }
      
        for (var j = 0; j< beers.length; j++){
          beerNames.push(beers[j].name.S);
          console.log(beers[j].name.S);
        }

        var returnText = '';
        if(beers.length > 0){
          returnText = "*The following "+ beerStyle +"s are available to order:*\n" + beerNames.join('\n');
        }else{
          returnText = 'There are currently no beers of that style available.'
        }

        var objReturn = {
            text: returnText,
            'mrkdwn': true,
            'unfurl_links': false
        }

          botReturn.reply(messReturn, objReturn);

   });
}

var stylesAvailable = function(response){
  
  var beerString = '';
  response.on('data', function(stuff) {
    beerString += stuff;
  });

  response.on('end', function() {

    var styles = [];
    var beers = JSON.parse(beerString);

    for (var j = 0; j< beers.length; j++){
      if(beers[j].style != undefined){
        if(!styles.includes(beers[j].style.S)){
          styles.push(beers[j].style.S);
        }
      }
    }

    var sortedStyles = styles.sort(); 
    var objReturn = {
        text: "*The current available beers list includes the following styles:*\n"+sortedStyles.join(", "),
        'mrkdwn': true,
        'unfurl_links': false
    }
      botReturn.reply(messReturn, objReturn);
  });

}

var getCurrentOrder = function(response){

  var beerString = '';
  response.on('data', function(stuff) {
    beerString += stuff;
  });
  response.on('end', function() {

    var beers = JSON.parse(beerString);

    var beerNames = [];
    for(var i = 0; i<beers.length; i++){
        beerNames.push(beers[i].name.S);
    }

    var objReturn = {
            text: "*The following beers were just ordered:*\n"+beerNames.join("\n") +"\n*If you don't see your favorite beer on the list go to www.foobar.com*"+ 
            " *and add it to the wish list.*",
            'mrkdwn': true,
            'unfurl_links': false
        }

          botReturn.reply(messReturn, objReturn);
  });

}

var getMostConsumedBeer = function(response){
  var beerString = '';
  response.on('data', function(stuff) {
    beerString += stuff;
  });

  response.on('end', function() {

    var beers = JSON.parse(beerString);

    var numConsumed = 0;
        for(var i = 0; i<beers.length;i++){
            if(beers[i].consumed != undefined){
              
              if(parseInt(beers[i].consumed.N) > numConsumed){
               // console.log(beers[i].consumed.N);
                  numConsumed = beers[i].consumed.N;
                  
              }
            }
        }
        console.log("MOST CONSUMED NUMBER" + numConsumed);
     // add most liked to list
        var mostConsumed = [];
        for(var i = 0; i<beers.length;i++){
          if(beers[i].consumed != undefined){
            if(beers[i].consumed.N === numConsumed){
                
                mostConsumed.push(beers[i].name.S)
            }
          }
        }

    var qualifyString = '';
        if(mostConsumed.length > 1){
          qualifyString = " are the most consumed beers, "+numConsumed+ " dead soldiers.";
        }else{
          qualifyString = " is the most consumed beer, "+numConsumed+ " dead soldiers.";
        }

        var outputString = '';
        for(var i = 0; i< mostConsumed.length; i++){
          
          if(i == mostConsumed.length - 2){
            mostConsumed[i] = mostConsumed[i]+", and ";
          }
          else if(i == mostConsumed.length - 1){
            mostConsumed[i] = mostConsumed[i];
          }else{
            mostConsumed[i] = mostConsumed[i] + ", ";
          }
        }

        var objReturn = {
          text: mostConsumed.join(" ") + qualifyString,
          'mrkdwn': true,
          'unfurl_links': false
        }

          botReturn.reply(messReturn, objReturn);


  });

}

var getTotalConsumed = function(response){
  var beerString = '';

  response.on('data', function(stuff) {
    beerString += stuff;
  });

  response.on('end', function() {

    var beers = JSON.parse(beerString);
    console.log(beers[0].name.S)
    var totalConsumed = 0;
    for(var i = 0; i<beers.length;i++){
        if(beers[i].consumed != undefined){
          totalConsumed +=  parseInt(beers[i].consumed.N);
        }
    }

    var objReturn = {
      text: "The total number of beers consumed since the last order is " + "*"+totalConsumed+"*",
      'mrkdwn': true,
      'unfurl_links': false
    }

      botReturn.reply(messReturn, objReturn);
});


}

var getBeerInventory = function(response){

  var beerString = '';

  response.on('data', function(stuff) {
    beerString += stuff;
  });

  response.on('end', function() {

    var beers = JSON.parse(beerString);

    var inventory = [];
    for(var i = 0; i<beers.length;i++){
        inventory.push(beers[i].name.S + "  -  Quantity On Hand: " + beers[i].onHand.N);
    }

    var objReturn = {
      text: "*Beer Inventory* \n" + inventory.join("\n"),
      'mrkdwn': true,
      'unfurl_links': false
    }

      botReturn.reply(messReturn, objReturn);


  });


}










