export function formatCurrency(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('pt-BR');
}
