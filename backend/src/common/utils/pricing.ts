import { Prisma } from '@prisma/client';

interface PricedProduct {
  salePrice: number | string | Prisma.Decimal;
  isOnSale: boolean;
  promoPrice: number | string | Prisma.Decimal | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
}

/**
 * Preço efetivo de venda: aplica promoPrice quando a peça está em promoção
 * e dentro da janela de datas (quando definida). Usado no catálogo digital,
 * no PDV e na criação de pedidos — fonte única de verdade do preço.
 */
export function getEffectivePrice(product: PricedProduct): number {
  const salePrice = Number(product.salePrice);
  if (!product.isOnSale || product.promoPrice == null) return salePrice;

  const now = new Date();
  if (product.saleStartsAt && now < new Date(product.saleStartsAt)) return salePrice;
  if (product.saleEndsAt && now > new Date(product.saleEndsAt)) return salePrice;

  return Number(product.promoPrice);
}
