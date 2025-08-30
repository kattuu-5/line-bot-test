console.log("🚀 index.js has started.");

const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');
const path = require('path');
const express = require('express');
const line = require('@line/bot-sdk');
require('dotenv').config();

const app = express();

// LINE Bot設定
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};
const client = new line.Client(config);

// スプレッドシート関連
const CREDENTIALS_PATH = path.join(__dirname, 'your-service-account.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// お気に入り＆スケジュール読み込み
async function loadScheduleAndFavorites() {
  const doc = new GoogleSpreadsheet(SHEET_ID);
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();

  const scheduleSheet = doc.sheetsByTitle['cast_schedule'];
  const favoriteSheet = doc.sheetsByTitle['cast_favorites'];

  const scheduleRows = await scheduleSheet.getRows();
  const favoriteRows = await favoriteSheet.getRows();

  const schedules = scheduleRows.map(row => ({
    castName: row.castName,
    workDate: row.workDate,
    workTime: row.workTime,
  }));

  const favorites = favoriteRows.map(row => ({
    userId: row.userId,
    castName: row.castName,
  }));

  return { schedules, favorites };
}

// LINE webhook
app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const results = await Promise.all(req.body.events.map(handleEvent));
    res.json(results);
  } catch (err) {
    console.error('❌ Webhook処理エラー:', err);
    res.status(500).end();
  }
});

// ユーザーからのメッセージ対応
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

<<<<<<< HEAD
console.log("🔍 userId:", event.source.userId);
  
=======
  const messageText = event.message.text;
  const userId = event.source.userId;
  const timestamp = new Date().toISOString();

  console.log("✅ handleEvent is triggered.");
  console.log("🔍 userId:", userId);

  // スプレッドシートにログを記録
  try {
    const doc = new GoogleSpreadsheet(SHEET_ID);
    const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    await doc.useServiceAccountAuth({
      client_email: creds.client_email,
      private_key: creds.private_key.replace(/\\n/g, '\n'),
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['messages_log'];
    await sheet.addRow({
      timestamp,
      userId,
      text: messageText,
    });
  } catch (err) {
    console.error('❌ スプレッドシートへの書き込み失敗:', err);
  }

>>>>>>> e7c5a2a (通知処理の修正とログ追加)
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `「${messageText}」を受け取りました。ありがとうございます！`,
  });
}

// テスト用エンドポイント
app.get('/', (req, res) => res.send('Lustworks LINE Bot is running!'));

// 本日以降のシフトを通知
async function notifyTodayOrFutureShifts() {
  try {
    console.log("🔔 通知処理を開始します...");

    const { schedules, favorites } = await loadScheduleAndFavorites();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingSchedules = schedules.filter(s => {
      const workDate = new Date(s.workDate);
      workDate.setHours(0, 0, 0, 0);
      return !isNaN(workDate) && workDate >= today;
    });

    console.log("📅 通知対象のスケジュール件数:", upcomingSchedules.length);

    const notifyMap = new Map();

    for (const favorite of favorites) {
      for (const shift of upcomingSchedules) {
        if (favorite.castName === shift.castName) {
          const msg = `【出勤予定】${shift.castName}：${shift.workDate} ${shift.workTime}`;
          if (!notifyMap.has(favorite.userId)) {
            notifyMap.set(favorite.userId, []);
          }
          notifyMap.get(favorite.userId).push(msg);
        }
      }
    }

    for (const [userId, messages] of notifyMap.entries()) {
      const text = messages.join('\n');
      console.log(`📤 ${userId} に通知送信中：\n${text}`);
      await client.pushMessage(userId, {
        type: 'text',
        text,
      });
    }

    console.log('✅ 通知処理完了');

  } catch (err) {
    console.error('❌ 通知処理エラー:', err);
  }
}

// サーバー起動 & 通知処理
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  notifyTodayOrFutureShifts(); // ← 起動時に1回通知実行
});
