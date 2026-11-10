// CLABE: 18 dígitos; el último es el verificador con pesos 3, 7, 1 sobre los 17 primeros.
// Misma regla que `private.is_valid_clabe` en la base.
const WEIGHTS = [3, 7, 1]

export function isValidClabe(value: string): boolean {
  if (!/^\d{18}$/.test(value)) return false
  let sum = 0
  for (let i = 0; i < 17; i++) sum += (Number(value[i]) * WEIGHTS[i % 3]!) % 10
  return (10 - (sum % 10)) % 10 === Number(value[17])
}
