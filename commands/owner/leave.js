export const command = ['leave', 'salir', 'exit']
export const description = 'Sale de un grupo específico'
export const category = 'Owner'
export const owner = true

export async function run({ sock, args, reply }) {
  try {
    if (args.length === 0) {
      return await reply(`⚠️ *Proporciona el número o ID del grupo*

💡 Ejemplos:
• *.leave* 5 (sale del grupo #5 de la lista)
• *.leave* 123456789@g.us`)
    }

    let groupId = args[0]

    // Si es número, buscar en la lista
    if (/^\d+$/.test(groupId)) {
      const chats = Object.values(sock.chats || {})
      const groups = chats.filter(chat => chat.id?.endsWith('@g.us'))
      const index = parseInt(groupId) - 1

      if (index < 0 || index >= groups.length) {
        return await reply('❌ *Número de grupo inválido*')
      }

      groupId = groups[index].id
    }

    if (!groupId.endsWith('@g.us')) {
      return await reply('❌ *ID de grupo inválido*')
    }

    await reply(`👋 *Saliendo del grupo...*`)
    await sock.groupLeave(groupId)

    await reply(`✅ *Salí del grupo correctamente*`)

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, owner, run }
