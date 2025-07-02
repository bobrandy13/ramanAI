import fs from 'fs';
import path from 'path';

export interface LogStreams {
  writeStream: fs.WriteStream;
  readStream: fs.ReadStream;
}

export const lineLength = 250;

export default function TryGetLogFileAndCreateifNotExists(
  username: string,
  user_log_files: Map<string, LogStreams>
) {
  if (!user_log_files.has(username)) {
    const log_path = path.join(__dirname, '..', '..', 'logs', username);
    const log_file_path = path.join(log_path, '.log');

    if (!fs.existsSync(log_path)) {
      fs.mkdirSync(log_path, { recursive: true });
    }

    if (!fs.existsSync(log_file_path)) {
      fs.writeFileSync(log_file_path, '', { flag: 'w+' });
    }

    const stat = fs.statSync(log_file_path);
    const size = stat.size;

    user_log_files.set(username, {
      writeStream: fs.createWriteStream(log_file_path, {
        flags: 'a+',
      }),
      readStream: fs.createReadStream(log_file_path, {
        start: Math.max(0, size - 20 * lineLength),
        end: Math.max(0, size - 1),
      }),
    });
  }

  return user_log_files.get(username)!;
}

export function ReadStream(readStream: fs.ReadStream): Promise<string> {
  return new Promise((resolve, reject) => {
    let previous_messages = '';
    readStream.on('data', (chunk) => {
      previous_messages += chunk;
    });
    readStream.on('end', () => {
      resolve(previous_messages);
    });
    readStream.on('error', (err) => {
      reject(err);
    });
  });
}
