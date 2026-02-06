import { getGroup, getSubBotConfig, save } from '../../lib/database.js'

export const command = ['gruposcontrol', 'gc', 'allowgroup', 'denygroup']
export const description = 'Controla en qué grupos funciona el bot (Owner/SubBot)'
export const category = 'Owner'

export async function run({ 
  sock, msg, chatId, args, reply, isOwner, isSubBot, subBotId, sender 
}) {
  try {
    // Solo funciona en privado
    if (chatId.endsWith('@g.us')) {
      return await reply('❌ *Este comando solo funciona en chat privado*')
    }

    // Verificar si es owner o sub-bot
    if (!isOwner && !isSubBot) {
      return await reply('⛔ *Solo owners o sub-bots pueden usar este comando*')
    }

    // Si es sub-bot, obtener su config
    let config = null
    let mode = 'owner'

    if (isSubBot && subBotId) {
      config = getSubBotConfig(subBotId)
      mode = 'subbot'
    } else {
      // Owner usa config global
      config = { allowedGroups: [], botMode: 'public' }
      if (global.db?.data?.settings) {
        config.allowedGroups = global.db.data.settings.allowedGroups || []
        config.botMode = global.db.data.settings.botMode || 'public'
      }
    }

    if (args.length === 0) {
      // Mostrar estado
      let text = `🎛️ *CONTROL DE GRUPOS*

📊 *Modo actual:* ${config.botMode}

📝 *Modos disponibles:*
• *public* - Funciona en todos los grupos
• *private* - Solo grupos permitidos
• *self* - Solo chat privado

`

      if (config.botMode === 'private') {
        text += `✅ *Grupos permitidos (${config.allowedGroups?.length || 0}):*
`
        if (config.allowedGroups?.length > 0) {
          for (let i = 0; i < config.allowedGroups.length; i++) {
            const gid = config.allowedGroups[i]
            try {
              const meta = await sock.groupMetadata(gid)
              text += `${i + 1}. ${meta.subject}
   🆔 ${gid}

`
            } catch {
              text += `${i + 1}. Grupo desconocido
   🆔 ${gid}

`
            }
          }
        } else {
          text += `_Ninguno_

`
        }
      }

      text += `💡 *Comandos:*
• *.gruposcontrol* mode public/private/self
• *.gruposcontrol* allow <id>
• *.gruposcontrol* deny <id>
• *.gruposcontrol* list`

      return await reply(text)
    }

    const action = args[0].toLowerCase()

    // Cambiar modo
    if (action === 'mode' || action === 'modo') {
      const newMode = args[1]?.toLowerCase()

      if (!['public', 'private', 'self'].includes(newMode)) {
        return await reply('⚠️ *Modos válidos:* public, private, self')
      }

      config.botMode = newMode

      if (isSubBot) {
        await save()
      } else {
        global.db.data.settings.botMode = newMode
        await save()
      }

      return await reply(`✅ *Modo cambiado a:* ${newMode}

${
        newMode === 'public' ? '🌍 Funcionaré en todos los grupos' :
        newMode === 'private' ? '🔒 Solo funcionaré en grupos permitidos' :
        '👤 Solo funcionaré en chat privado'
      }`)
    }

    // Permitir grupo
    if (action === 'allow' || action === 'permitir') {
      if (config.botMode !== 'private') {
        return await reply('⚠️ *Primero cambia el modo a private*

*.gruposcontrol* mode private')
      }

      const groupId = args[1]
      if (!groupId || !groupId.endsWith('@g.us')) {
        return await reply('⚠️ *Proporciona un ID de grupo válido*

Ejemplo: *.gruposcontrol* allow 123456@g.us')
      }

      if (!config.allowedGroups.includes(groupId)) {
        config.allowedGroups.push(groupId)

        if (isSubBot) {
          await save()
        } else {
          global.db.data.settings.allowedGroups = config.allowedGroups
          await save()
        }
      }

      return await reply(`✅ *Grupo permitido:*\n\n${groupId}\n\n🤖 Ahora funcionaré en este grupo`)
    }

    // Denegar grupo
    if (action === 'deny' || action === 'denegar' || action === 'remove') {
      const groupId = args[1]
      if (!groupId) {
        return await reply('⚠️ *Proporciona un ID de grupo*')
      }

      config.allowedGroups = config.allowedGroups.filter(id => id !== groupId && !id.includes(groupId))

      if (isSubBot) {
        await save()
      } else {
        global.db.data.settings.allowedGroups = config.allowedGroups
        await save()
      }

      return await reply(`❌ *Grupo removido:*\n\n${groupId}\n\n🚫 Ya no funcionaré en este grupo`)
    }

    // Listar grupos
    if (action === 'list' || action === 'lista') {
      let text = `📋 *GRUPOS ${isSubBot ? 'DE TU SUB-BOT' : 'GLOBALES'}*

`

      const chats = Object.values(sock.chats || {})
      const groups = chats.filter(chat => chat.id?.endsWith('@g.us'))

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i]
        const isAllowed = config.allowedGroups?.includes(group.id)
        const status = isAllowed ? '✅' : config.botMode === 'private' ? '❌' : '✅'

        text += `${i + 1}. ${status} *${group.subject || 'Sin nombre'}*
`
        text += `   🆔 ${group.id}

`
      }

      text += `💡 *Para permitir:* .gruposcontrol allow <id>`

      return await reply(text)
    }

    await reply('⚠️ *Acción no válida*\n\nUsa: mode, allow, deny, list')

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, run }
