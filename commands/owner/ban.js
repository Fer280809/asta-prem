import { getUser, save } from '../../lib/database.js'
import { toJid, toNumber } from '../../lib/permissions.js'

export const command = ['ban', 'banuser']
export const description = 'Banea/desbanea un usuario del bot'
export const category = 'Owner'
export const owner = true

export async function run({ sock, msg, chatId, args, reply }) {
  try {
    let targetJid = null

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0]
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      targetJid = msg.message.extendedTextMessage.contextInfo.participant
    } else if (args.length > 0) {
      const num = args[0].replace(/[^0-9]/g, '')
      if (num.length >= 10) targetJid = num + '@s.whatsapp.net'
    }

    if (!targetJid) {
      return await reply('⚠️ *Menciona a alguien o proporciona número*')
    }

    targetJid = toJid(targetJid)
    const targetNum = toNumber(targetJid)

    const user = getUser(targetJid)
    user.banned = !user.banned
    await save()

    const status = user.banned ? '🚫 BANEADO' : '✅ DESBANEADO'

    await reply(`${status}

👤 Usuario: @${targetNum}
📊 Estado: ${user.banned ? 'No puede usar el bot' : 'Puede usar el bot'}
📝 Razón: ${args.slice(1).join(' ') || 'Sin razón'}`, {
      mentions: [targetJid]
    })

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, owner, run }
