import { Message, OmitPartialGroupDMChannel } from 'discord.js';

export function IsRamanAiReq(
  message: OmitPartialGroupDMChannel<Message<boolean>>
): boolean {
  return message.content.includes('raman-ai');
  // message.author.username !== 'Raman Insulter Bot'
}
