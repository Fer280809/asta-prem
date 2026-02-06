import { getUser, getGroup, save } from '../../lib/database.js'
import { toJid, toNumber } from '../../lib/permissions.js'

export const command = ['warn', 'advertencia', 'adv']
export const description = 'Sistema de 3 advertencias = kick'
export const category = 'Admin'
export const admin = true
export const botAdmin = true
export const group = true

const MAX_WARNS = 3

export async function run({ sock, msg, chatId, args, reply, isOwner }) {
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
      return await reply(`⚠️ *Menciona a alguien o responde a su mensaje*

💡 Ejemplos:
• *.warn* @usuario [razón]
• *.warn* (respondiendo) spam
• *.warn* 521234567890`)
    }

    targetJid = toJid(targetJid)
    const targetNum = toNumber(targetJid)

    // No advertir admins (solo owner puede)
    const groupMetadata = await sock.groupMetadata(chatId)
    const participant = groupMetadata.participants.find(p => p.id === targetJid)
    const isTargetAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin'

    if (isTargetAdmin && !isOwner) {
      return await reply('❌ *No puedes advertir a un administrador*')
    }

    const user = getUser(targetJid)
    user.warn = (user.warn || 0) + 1

    const reason = args.slice(1).join(' ') || 'Sin razón especificada'

    await save()

    let response = `⚠️ *ADVERTENCIA* @${targetNum}

📊 Advertencias: ${user.warn}/${MAX_WARNS}
📝 Razón: ${reason}
👮 Advertido por: Admin`

    // Si llega al máximo, expulsar
    if (user.warn >= MAX_WARNS) {
      try {
        await sock.groupParticipantsUpdate(chatId, [targetJid], 'remove')
        user.warn = 0
        await save()

        response += `

🚫 *EXPULSADO AUTOMÁTICAMENTE*

@${targetNum} alcanzó ${MAX_WARNS} advertencias y fue removido del grupo.`
      } catch {
        response += `

❌ *No se pudo expulsar automáticamente*`
      }
    } else {
      response += `

💡 *Al llegar a ${MAX_WARNS} advertencias será expulsado*`
    }

    await reply(response, { mentions: [targetJid] })

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, admin, botAdmin, group, run }
