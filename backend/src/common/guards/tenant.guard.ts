import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/** Garante que a empresa do token existe e não está bloqueada (inadimplência/banimento). */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const companyId = req.user?.companyId;
    if (!companyId) return false;

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new ForbiddenException('Empresa não encontrada.');
    if (company.isBlocked) throw new ForbiddenException('Empresa bloqueada. Contate o suporte.');

    req.tenantId = company.id;
    return true;
  }
}
