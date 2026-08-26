import { IsOptional, IsString } from 'class-validator';

export class DemoAccessDto {
  /** Slug do nicho (roupas/calcados/lingerie/infantil/acessorios/boutique/otica)
   *  — vem do hub /demo do R_FoodSaaS. Ausente ou desconhecido cai na conta
   *  genérica "Loja Demo Moda" (comportamento anterior, preservado). */
  @IsOptional()
  @IsString()
  niche?: string;
}
