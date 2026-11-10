// Hook PreToolUse: impide que Claude ejecute comandos de terminal que mencionen archivos .env
// con secretos. Solo se permite la plantilla .env.example. Complementa las reglas deny de Read/Edit.
let input = ''
process.stdin.on('data', (chunk) => (input += chunk))
process.stdin.on('end', () => {
  let command = ''
  try {
    command = JSON.parse(input).tool_input?.command ?? ''
  } catch {
    process.exit(0)
  }
  const withoutTemplate = command.replaceAll('.env.example', '')
  if (/(^|[\s/\\'"=*(])\.env(\b|$)/.test(withoutTemplate)) {
    console.error(
      'Bloqueado: los archivos .env contienen secretos y Claude no debe leerlos ni modificarlos. ' +
        'Pide al usuario que haga el cambio.',
    )
    process.exit(2)
  }
  process.exit(0)
})
