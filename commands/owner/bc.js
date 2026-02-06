export const command = ['bc', 'broadcast', 'anuncio']
export const description = 'Envía mensaje a todos los chats'
export const category = 'Owner'
export const owner = true

export async function run({ sock, chatId, args, text, reply }) {
  try {
    if (args.length === 0) {
      return await reply('⚠️ *Proporciona un mensaje*')
    }

    await reply('⏳ *Enviando broadcast...*')

    const chats = Object.keys(sock.chats || {})
    let sent = 0
    let failed = 0

    for (const chat of chats) {
      try {
        if (chat.endsWith('@g.us') || chat.endsWith('@s.whatsapp.net')) {
          await sock.sendMessage(chat, {
            text: `📢 *ANUNCIO*

${text}

_~${global.config.botName}_`
          })
          sent++
          await new Promise(r => setTimeout(r, 1000))
        }
      } catch {
        failed++
      }
    }

    await reply(`✅ *Broadcast completado*

📤 Enviados: ${sent}
❌ Fallidos: ${failed}`)

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, owner, run }
