import { getUser, save } from '../../lib/database.js'
import { toJid, toNumber } from '../../lib/permissions.js'

export const command = ['resetwarn', 'delwarn', 'unwarn']
export const description = 'Resetea las advertencias de un usuario'
export const category = 'Admin'
export const admin = true
export const group = true

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

    if (!targetJid) return await reply('⚠️ *Menciona a alguien*')

    targetJid = toJid(targetJid)
    const targetNum = toNumber(targetJid)

    const user = getUser(targetJid)
    const previousWarns = user.warn || 0
    user.warn = 0
    await save()

    await reply(`✅ *Advertencias reseteadas*

👤 @${targetNum}
📊 Tenía: ${previousWarns} advertencias
📊 Ahora: 0`, { mentions: [targetJid] })

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, admin, group, run }
