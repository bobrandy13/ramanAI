import { Message, OmitPartialGroupDMChannel } from 'discord.js';

export function IsRamanAiReq(
  message: OmitPartialGroupDMChannel<Message<boolean>>
): boolean {
  return message.content.startsWith('raman-ai') && !message.author.bot;
}
