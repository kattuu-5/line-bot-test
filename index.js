const express = require('express');
const line = require('@line/bot-sdk');
require('dotenv').config();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

console.log("🔍 userId:", event.source.userId);
  
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `「${event.message.text}」を受け取りました。ありがとうございます！`,
  });
}

app.get('/', (req, res) => res.send('Lustworks LINE Bot is running!'));
const port = process.env.PORT || 3000;
app.listen(port);
