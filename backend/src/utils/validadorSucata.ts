// Palavras-chave que indicam veículos a EXCLUIR
const PALAVRAS_EXCLUIR = [
  "MOTOCICLETA",
  "MOTOCICLETAS",
  "MOTO ",
  "MOTONETA",
  "MOTO AQUÁTICA",
  "JETSKI",
  "TRICICLO",
  "QUADRICICLO",
  "BICICLETA",
  "REBOQUE",
  "SEMIREBOQUE",
  "CARRETILHA",
];

// Palavras que indicam sucata INSERVÍVEL
const PALAVRAS_INSERVIVEL = [
  "INSERVÍVEL",
  "INSERVIVEL",
  "DESTRUÍDA",
  "DESTROÇOS",
  "SUCATA IRRECUPERÁVEL",
  "IRRECUPERÁVEL",
  "IRRECUPERAVEL",
];

// Palavras que indicam sucata APROVEITÁVEL
const PALAVRAS_APROVEITAVEL = [
  "SUCATA",
  "REAPROVEITÁVEL",
  "REAPROVEITAVEL",
  "APROVEITÁVEL",
  "APROVEITAVEL",
  "PEÇAS",
  "DESMONTE",
];

export function isSucataVeicularValida(texto: string): boolean {
  const textoUpper = texto.toUpperCase();

  // Rejeita palavras de exclusão
  if (PALAVRAS_EXCLUIR.some((p) => textoUpper.includes(p))) {
    return false;
  }

  // Deve conter ao menos uma palavra de aceitação
  return PALAVRAS_APROVEITAVEL.some((p) => textoUpper.includes(p));
}

export function mapearTipoSucata(texto: string): string {
  const textoUpper = texto.toUpperCase();

  if (PALAVRAS_INSERVIVEL.some((p) => textoUpper.includes(p))) {
    return "inservivel";
  }

  return "aproveitavel";
}

export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toUpperCase()
    .trim();
}
