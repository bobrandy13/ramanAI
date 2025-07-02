import fs from 'fs';
import util from 'util';
import path from 'path';
import { Client, IntentsBitField, Message } from 'discord.js';
import dotenv from 'dotenv';
import { IsRamanAiReq } from './helpers/IsRamanReq';
import TryGetLogFileAndCreateifNotExists, {
  lineLength,
  LogStreams,
  ReadStream,
} from './helpers/TryGetLogFileAndCreateIfNotExists';
import RemoveNewLines from './helpers/RemoveNewLines';

dotenv.config();

var user_log_files = new Map<string, LogStreams>();
const RAMAN_AI_STRING_OFFSET = 9;

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageTyping,
  ],
});

client.on('ready', (c) => {
  console.log(`${c.user.tag} is ready`);
});

client.on('messageCreate', async (m) => {
  if (!IsRamanAiReq(m)) {
    return;
  }

  const username = m.author.username;
  const msg = m.content.substring(RAMAN_AI_STRING_OFFSET);

  console.log(`Debug: Processing message from user: ${username}`);

  console.log(`Debug: Getting log file for user: ${username}`);
  const user_log_file = TryGetLogFileAndCreateifNotExists(
    username,
    user_log_files
  );

  console.log(`Debug: Reading log file for user: ${username}`);
  const previous_messages = await ReadStream(user_log_file.readStream);
  console.log(previous_messages);
  // parse previous msgs and response

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `<prompt>
RESPONSE LIMIT: Under 250 words.

PREVIOUS CONVERSATION:
${previous_messages}

FORMAT NOTE: Previous messages are in format: timestamp|-|username|-|query|-|response

INSTRUCTIONS:
- Respond as a helpful AI assistant
- Continue the conversation naturally using previous context
- Do NOT use the timestamp|-|username format in your response
- Just provide your response text directly
- Be concise and direct

USER QUERY: ${m.content.substring(8)}
</prompt>`,
                },
              ],
            },
          ],
        }),
      }
    );
    if (!response.ok) {
      console.log('Error response:', await response.text());
      return;
    }

    const r = await response.json();
    const responseText = r.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Response Text:', responseText.trim());
    m.reply(`${responseText}`);

    const logEntry = util.format('%s|-|%s|-|%s', Date.now(), username, msg);

    const paddedEntry =
      logEntry.length > lineLength
        ? logEntry.substring(0, lineLength - 1)
        : logEntry.padEnd(lineLength, ' ');

    user_log_file.writeStream.write(paddedEntry + '\n');
    user_log_file.writeStream.end();
    user_log_file.readStream.destroy();
    user_log_files.delete(username);
  } catch {
    console.log('err');
    m.reply('You broke raman-ai. ');
  }
});

client.login(process.env.DISCORD_API_KEY);
