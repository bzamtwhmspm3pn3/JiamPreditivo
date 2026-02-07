export function validateData(data) {
  if (!data || !Array.isArray(data.y)) {
    throw new Error("Dados inválidos: variável dependente ausente");
  }
}
