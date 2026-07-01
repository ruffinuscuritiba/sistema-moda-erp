import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/** Extrai o companyId do JWT (req.user) — nunca aceitar do body. */
export const CompanyId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest();
  const companyId = req.user?.companyId;
  if (!companyId) throw new UnauthorizedException('companyId ausente no token.');
  return companyId;
});
