//based on git://gist.github.com/265460.git
  var http        = require('http'),
      ws          = require('./vendor/ws'),
      base64      = require('./vendor/base64'),
      arrays      = require('./vendor/arrays');
      phptojs     = require('./vendor/phptojs');

  function writeLog(logStr)
  {
    now =  new Date();
    console.log(  now.toString()+':'+logStr);
  }
  
  var happyWords = [  ':)', ':-)' , ':D',  '8-)', '(^_^)' ];
  var sadWords = [  ':(', ':-()', ':~(' , '>:-(', ':-<', ':-(', '(-_-)', '(._.)'];   
  
  var happinessCount  = 50;
  var sadnessCount    = 50;
  
  var pCount          = 0;
  var clientCount     = 0;
  var message         = '';
  var trackedWords    = [];
  
  trackedWords =  trackedWords.concat(happyWords,sadWords);

  var trackedWordsTwitterString = trackedWords.join( ',');

  function caclulateTwitterMood( text )
  {
    
    pCount++;
    happyWords.forEach( function(word) {
        if ( phptojs.strpos((text+' ').toLowerCase(),word) ) {
          happinessCount++;
        }
    });
    
    sadWords.forEach( function(word) {
        if ( phptojs.strpos((text+' ').toLowerCase(),word) ) {
          sadnessCount++;
        }
    });
    
    // adds some dynamics otherwise gauge stagnates over time
    if ( (pCount%100)==0 ) {
        happinessCount    =  parseInt( ( happinessCount / ( happinessCount + sadnessCount   ) ) *100);
        sadnessCount  =  parseInt( ( sadnessCount / ( happinessCount + sadnessCount   ) ) *100);
        pCount = 0;
    }
    //return score [1..100]
    return parseInt( ( happinessCount / ( (happinessCount) + ( sadnessCount ) ) ) * 100);
    
  }
  
  var Username = '';
  var Password = '';

  
  var auth = base64.encode(Username + ':' + Password);
  var headers = {
      'Authorization' : 'Basic ' + auth,
      'Host'          : 'stream.twitter.com'
  };

  var clients = [];

  var twitter = http.createClient(80, 'stream.twitter.com');
  var request = twitter.request('GET', '/1/statuses/filter.json?track=' + trackedWordsTwitterString , headers);

  request.addListener('response', function (response) {
    response.setEncoding('utf8');
    response.addListener('data', function (chunk) {
        message += chunk;
        // if carriage return.
        if ( chunk.charCodeAt(chunk.length-2) == 13   ) {
            message.split("\n").forEach(function(tweet) {
                if (tweet.trim().length > 0) {
                      try {    
                        tweet = JSON.parse(tweet); 
                        tweet.score = caclulateTwitterMood( tweet.text );
                        tweet = JSON.stringify( tweet );
                        clients.forEach (function(c) {
                          c.write(tweet);
                        });                     
                      } catch (Err) {
                          writeLog('err:'+Err);
                      }
                }
            });
            message = '';
        }
    });
  });
  
  request.end();
  writeLog('request_ends');

  ws.createServer(function (websocket) {
      
    websocket.on('error', function (errStr) {
        writeLog("error: " + errStr);
    });
    
    clients.push(websocket);
    websocket.addListener('connect', function (resource) {
        clientCount++;
        writeLog('clients connected: '+clientCount );
      
     }).addListener('close', function () {
        clientCount--;        
        clients.remove(websocket);
        writeLog('clients connected: '+clientCount );
        
      });
  }).listen(8001);

  writeLog('start listening 8001');
