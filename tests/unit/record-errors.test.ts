import { describe, expect, it } from 'vitest'
import { errorMessage } from '../../src/shared/lib/record-errors.js'

describe('errorMessage con restricciones nombradas', () => {
  it('explica las reglas de las fechas del contrato', () => {
    const violation = (name: string) =>
      errorMessage({
        code: '23514',
        message: `new row for relation "employee_contracts" violates check constraint "${name}"`,
      })
    expect(violation('employee_contracts_dates_check')).toBe(
      'El término del contrato no puede ser anterior a su inicio.',
    )
    expect(violation('employee_contracts_indefinite_dates_check')).toBe(
      'Un contrato indeterminado no lleva fechas de inicio ni de término.',
    )
  })

  it('explica por qué no se elimina un contrato con confidencialidad vinculada', () => {
    expect(
      errorMessage({
        code: '23503',
        message:
          'update or delete on table "employee_contracts" violates foreign key constraint "employee_confidentiality_agreements_contract_fkey" on table "employee_confidentiality_agreements"',
      }),
    ).toBe(
      'No se puede eliminar el contrato: tiene cartas o acuerdos de confidencialidad vinculados.',
    )
  })

  it('usa el mensaje general para otras restricciones', () => {
    expect(
      errorMessage({
        code: '23514',
        message: 'violates check constraint "employment_records_check"',
      }),
    ).toBe('Algún dato no cumple las reglas, por ejemplo las fechas.')
  })
})
