// Substitui variáveis de template {{nome}}, {{queixa}}, {{data}}, {{hora}}, {{ciclo}}
export const renderTemplate = (
  body: string,
  vars: {
    nome?: string
    queixa?: string
    data?: string
    hora?: string
    ciclo?: string
  },
): string => {
  const map: Record<string, string> = {
    nome: vars.nome ?? '',
    queixa: vars.queixa ?? '',
    data: vars.data ?? '[data]',
    hora: vars.hora ?? '[hora]',
    ciclo: vars.ciclo ? `${vars.ciclo} semanas` : '[ciclo]',
  }
  return body.replace(
    /\{\{\s*(\w+)\s*\}\}/g,
    (_, key: string) => map[key] ?? `[${key}]`,
  )
}
