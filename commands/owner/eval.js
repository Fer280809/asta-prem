import { inspect } from 'util'

export const command = ['eval', '=>']
export const description = 'Ejecuta código JavaScript'
export const category = 'Owner'
export const owner = true

export async function run({ sock, msg, chatId, args, text, reply }) {
  try {
    if (args.length === 0) {
      return await reply('⚠️ Proporciona código')
    }

    let code = text
    if (code.startsWith('```')) {
      code = code.replace(/```(js)?/g, '').trim()
    }

    const start = Date.now()

    const context = {
      sock, msg, chatId, reply, console, require, process, global,
      Buffer, Promise, setTimeout, setInterval, JSON, Object, Array,
      String, Number, Date, Math, Map, Set, Error
    }

    let result
    if (code.includes('await')) {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
      const fn = new AsyncFunction(...Object.keys(context), code)
      result = await fn(...Object.values(context))
    } else {
      const fn = new Function(...Object.keys(context), code)
      result = fn(...Object.values(context))
    }

    const time = Date.now() - start
    let output = typeof result === 'string' ? result : inspect(result, { depth: 2 })

    if (output.length > 4000) {
      output = output.substring(0, 4000) + '...'
    }

    await reply(`✅ *Evaluado en ${time}ms*

\`\`\`js
${output}
\`\`\``)

  } catch (error) {
    await reply(`❌ *Error*
\`\`\`
${error.message}
\`\`\``)
  }
}

export default { command, description, category, owner, run }
