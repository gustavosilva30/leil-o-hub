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
  "IRRECUPERÁVEL",
  "IRRECUPERAVEL",
];

// Palavras/marcas que identificam que o lote é veicular
const PALAVRAS_VEICULO = [
  "VEICULO", "VEÍCULO", "CARRO", "CAMINHAO", "CAMINHÃO", "AUTOMOVEL", "AUTOMÓVEL",
  "PLACA", "CHASSI", "RENAVAM", "MOTOR", "UTILITARIO", "UTILITÁRIO", "CAMIONETE", "CAMINHONETE",
  "CHEVROLET", "GM", "FIAT", "VOLKSWAGEN", "VW", "FORD", "HYUNDAI", "TOYOTA", "HONDA", "RENAULT",
  "JEEP", "NISSAN", "PEUGEOT", "CITROEN", "CITROËN", "MITSUBISHI", "KIA", "BMW", "MERCEDES", "AUDI",
  "YAMAHA", "SUZUKI", "CHERY", "VOLVO", "LAND ROVER", "IVECO", "SCANIA"
];

export function isSucataVeicularValida(texto: string): boolean {
  const textoUpper = texto.toUpperCase();

  // Rejeita palavras de exclusão
  if (PALAVRAS_EXCLUIR.some((p) => textoUpper.includes(p))) {
    return false;
  }

  // Deve conter ao menos uma palavra de aceitação de sucata
  const ehSucata = PALAVRAS_APROVEITAVEL.some((p) => textoUpper.includes(p));
  if (!ehSucata) return false;

  // Deve conter ao menos uma indicação veicular ou de marca
  return PALAVRAS_VEICULO.some((p) => textoUpper.includes(p));
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
