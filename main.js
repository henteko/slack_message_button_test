const Botkit = require('botkit');

/***********************************
 * Setup
 ***********************************/

if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
  console.log('Error: Specify clientId clientSecret and port in environment');
  process.exit(1);
}

var controller = Botkit.slackbot({
  json_file_store: './bot_db/'
}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot']
  }
);

controller.on('create_bot',function(bot,config) {

  if (_bots[bot.config.token]) {
    // already online! do nothing.
  } else {
    bot.startRTM(function(err) {

      if (!err) {
        trackBot(bot);
      }

      bot.startPrivateConversation({user: config.createdBy},function(err,convo) {
        if (err) {
          console.log(err);
        } else {
          convo.say('I am a bot that has just joined your team');
          convo.say('You must now /invite me to a channel so that I can be of use!');
        }
      });

    });
  }

});


// Handle events related to the websocket connection to Slack
controller.on('rtm_open',function(bot) {
  console.log('** The RTM api just connected!');
});

controller.on('rtm_close',function(bot) {
  console.log('** The RTM api just closed');
  // you may want to attempt to re-open
});

controller.setupWebserver(process.env.port,function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver);

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});

var _bots = {};
function trackBot(bot) {
  _bots[bot.config.token] = bot;
}

controller.storage.teams.all(function(err,teams) {

  if (err) {
    throw new Error(err);
  }

  // connect all teams with bots up to slack!
  for (var t  in teams) {
    if (teams[t].bot) {
      controller.spawn(teams[t]).startRTM(function(err, bot) {
        if (err) {
          console.log('Error connecting bot to Slack:',err);
        } else {
          trackBot(bot);
        }
      });
    }
  }

});

/**************************
 * Reply
 **************************/

controller.on('interactive_message_callback', function(bot, message) {
  console.log('interactive_message_callback');
  console.log(message);

  var reply = {
    text: 'どれか押してね！',
    attachments: []
  };

  reply.attachments.push({
    title: 'ほい',
    callback_id: '1-1',
    attachment_type: 'default',
    actions: [
      {
        "name":"flag",
        "text": ":waving_black_flag: Flag",
        "value": "flag",
        "type": "button"
      },
      {
        "text": "Delete",
        "name": "delete",
        "value": "delete",
        "style": "danger",
        "type": "button",
        "confirm": {
          "title": "本当に消していいの？",
          "text": "消すよ！確認してね！",
          "ok_text": "はい",
          "dismiss_text": "いいえ"
        }
      }
    ]
  });
  bot.replyInteractive(message, reply);
});

controller.hears('hay', ['direct_message','direct_mention','mention'],function(bot,message) {
  var reply = {
    text: 'どれか押してね！',
    attachments: []
  };

  reply.attachments.push({
    title: 'Title',
    callback_id: '1-1',
    attachment_type: 'default',
    actions: [
      {
        "name":"flag",
        "text": ":waving_black_flag: Flag",
        "value": "flag",
        "type": "button"
      },
      {
        "text": "Delete",
        "name": "delete",
        "value": "delete",
        "style": "danger",
        "type": "button",
        "confirm": {
          "title": "本当に消していいの？",
          "text": "消すよ！確認してね！",
          "ok_text": "はい",
          "dismiss_text": "いいえ"
        }
      }
    ]
  });
  bot.reply(message, reply);
});
