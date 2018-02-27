
var restify = require('restify');
var builder = require('botbuilder');
var axios = require('axios');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user, make a call to luis API and and respond by echoing the intent and entity
var bot = new builder.UniversalBot(connector, 
    function (session) {
    
    //Default to the hard-coded luis app id and key for simplicity (Won't be doing this for a production code)
    var luisAppId = process.env.LuisAppId || 'a81d6c24-ea2f-45da-90ba-f0e6ed56ed5d';
    var luisAPIKey = process.env.LuisAPIKey || 'bd1522564df74babba3ce4fc9b43e482';
    var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

    let luisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey + '&staging=true&q=' + session.message.text;
 
    //Make direct HTTP GET call to luisModelUrl to detect the user intent (used axios npm package to make the http call), 
    //We can also use Bot Builder SDK's LuisRecognizer to talk to luis and detect the user intent
    axios.get(luisModelUrl)
         .then(function (response) {
            //read intent, entity and query from the JSON response
            let data = response.data,
                intent = data.topScoringIntent.intent,
                query = data.query,
                entity = null;
        
            if(data.entities != null && data.entities.length > 0){
                entity = data.entities[0].entity
            }

            //build the response message
            let message = entity != null ? `Your query is: ${query}, Your Intent is to '${intent}' the ${entity} yard` : 
                                          `Your query is: ${query}, Your Intent is to '${intent}'.`;
            session.send(message);
         })
         .catch(function (error) {
            console.log(error);
         });
});