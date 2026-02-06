import { getGroup, save } from '../../lib/database.js'
import { commands } from '../../lib/loader.js'

export const command = ['toggle', 'enable', 'disable', 'switch']
export const description = 'Activa o desactiva comandos/categorías'
export const category = 'Owner'
export const admin = true
export const group = true

export async function run({ chatId, args, reply, isOwner }) {
  try {
    if (args.length === 0) {
      const group = getGroup(chatId)

      let text = `⚙️ *CONFIGURACIÓN DE COMANDOS*

📋 *Comandos desactivados:*
${group.disabledCommands.length > 0 ? group.disabledCommands.map(c => `  ❌ ${c}`).join('\n') : '  _Ninguno_'}

📁 *Categorías desactivadas:*
${group.disabledCategories.length > 0 ? group.disabledCategories.map(c => `  ❌ ${c}`).join('\n') : '  _Ninguna_'}

💡 *Uso:*
• *.toggle* off kick (desactiva kick)
• *.toggle* on kick (activa kick)
• *.toggle* offcat economia (desactiva categoría)
• *.toggle* oncat economia (activa categoría)
• *.toggle* list (ver todos los comandos)`

      return await reply(text)
    }

    const action = args[0].toLowerCase() // on, off, oncat, offcat, list
    const target = args[1]?.toLowerCase()

    const group = getGroup(chatId)

    // Listar comandos disponibles
    if (action === 'list') {
      const cats = {}
      for (const [name, cmd] of commands) {
        const cat = cmd.category || 'Otros'
        if (!cats[cat]) cats[cat] = []
        if (!cats[cat].includes(name)) cats[cat].push(name)
      }

      let text = `📋 *COMANDOS DISPONIBLES*

`
      for (const [cat, cmds] of Object.entries(cats).sort()) {
        text += `*${cat}:* ${cmds.slice(0, 10).join(', ')}${cmds.length > 10 ? '...' : ''}\n`
      }
      return await reply(text)
    }

    // Desactivar comando específico
    if (action === 'off' && target) {
      if (!commands.has(target)) {
        return await reply(`❌ *Comando no existe:* ${target}\n\n💡 Usa *.toggle list* para ver comandos`)
      }

      if (!group.disabledCommands.includes(target)) {
        group.disabledCommands.push(target)
        await save()
      }

      return await reply(`✅ *Comando desactivado:* ${target}\n\n🚌 Este comando ya no funcionará en este grupo`)
    }

    // Activar comando específico
    if (action === 'on' && target) {
      group.disabledCommands = group.disabledCommands.filter(c => c !== target)
      await save()

      return await reply(`✅ *Comando activado:* ${target}\n\n✓ Ahora funciona normalmente`)
    }

    // Desactivar categoría
    if ((action === 'offcat' || action === 'offcategoria') && target) {
      // Verificar si categoría existe
      const cats = new Set()
      for (const [, cmd] of commands) {
        cats.add(cmd.category?.toLowerCase() || 'otros')
      }

      if (!cats.has(target)) {
        return await reply(`❌ *Categoría no existe:* ${target}\n\n💡 Usa *.toggle list* para ver categorías`)
      }

      if (!group.disabledCategories.includes(target)) {
        group.disabledCategories.push(target)
        await save()
      }

      return await reply(`✅ *Categoría desactivada:* ${target}\n\n🚌 Todos los comandos de esta categoría están desactivados`)
    }

    // Activar categoría
    if ((action === 'oncat' || action === 'oncategoria') && target) {
      group.disabledCategories = group.disabledCategories.filter(c => c !== target)
      await save()

      return await reply(`✅ *Categoría activada:* ${target}\n\n✓ Los comandos funcionan normalmente`)
    }

    await reply('⚠️ *Uso incorrecto*\n\n💡 *.toggle* on/off/comando\n💡 *.toggle* oncat/offcat/categoria')

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, admin, group, run }
