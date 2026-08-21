import {
  BadRequestException, Body, CanActivate, ConflictException, Controller,
  ExecutionContext, Get, Injectable, Module, Param, Patch, Post,
  UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { createHash, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { PrismaModule } from '../../database/prisma.module';
import { slugify } from '../../common/utils/slugify';

// ─── Constantes ───────────────────────────────────────────────────────────

const PLATFORM_ROLE = 'PLATFORM_ADMIN';

// ─── Guard ────────────────────────────────────────────────────────────────

/**
 * Autenticação separada da JwtStrategy normal (que exige um User real no
 * banco, tenant-bound). O super admin da plataforma não pertence a nenhuma
 * Company — valida o JWT diretamente e checa o claim `role`.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers?.authorization as string | undefined;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (!token) throw new UnauthorizedException();

    try {
      const payload = this.jwt.verify(token) as { role?: string };
      if (payload?.role !== PLATFORM_ROLE) throw new UnauthorizedException();
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

// ─── DTOs ─────────────────────────────────────────────────────────────────

class SuperAdminLoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

class CreateCompanyDto {
  @IsString() @MinLength(2) name: string;
  @IsString() @IsOptional() slug?: string;
  @IsString() @MinLength(2) ownerName: string;
  @IsEmail() ownerEmail: string;
  @IsString() @MinLength(8) ownerPassword: string;
}

class ToggleBlockDto {
  @IsBoolean() isBlocked: boolean;
}

class ResetOwnerPasswordDto {
  @IsString() @MinLength(8) newPassword: string;
}

// ─── Service ──────────────────────────────────────────────────────────────

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  login(dto: SuperAdminLoginDto) {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    if (!email || !password) {
      throw new UnauthorizedException('Super admin não configurado no servidor (env ausente).');
    }
    if (!this.safeEqual(dto.email, email) || !this.safeEqual(dto.password, password)) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const accessToken = this.jwt.sign(
      { sub: 'platform', role: PLATFORM_ROLE },
      { expiresIn: '8h' },
    );
    return { accessToken };
  }

  /** Comparação de tamanho constante — evita side-channel por timing. */
  private safeEqual(a: string, b: string): boolean {
    const ha = createHash('sha256').update(a).digest();
    const hb = createHash('sha256').update(b).digest();
    return timingSafeEqual(ha, hb);
  }

  async listCompanies() {
    const companies = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { customers: true, orders: true, products: true } },
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, name: true, email: true, isActive: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      segment: c.segment,
      isBlocked: c.isBlocked,
      subscriptionStatus: c.subscriptionStatus,
      createdAt: c.createdAt,
      customersCount: c._count.customers,
      ordersCount: c._count.orders,
      productsCount: c._count.products,
      owner: c.users[0] ?? null,
    }));
  }

  /** Cria uma nova loja (Company) já com o login do dono. */
  async createCompany(dto: CreateCompanyDto) {
    const base = slugify(dto.slug ?? dto.name) || 'loja';
    let slug = base;
    let attempt = 1;
    while (await this.prisma.company.findUnique({ where: { slug } })) {
      attempt += 1;
      slug = `${base}-${attempt}`;
    }

    const ownerEmail = dto.ownerEmail.trim().toLowerCase();
    const emailTaken = await this.prisma.user.findUnique({ where: { email: ownerEmail } });
    if (emailTaken) throw new ConflictException('Este e-mail já está em uso por outro usuário.');

    const hashedPassword = await bcrypt.hash(dto.ownerPassword, 10);

    const company = await this.prisma.company.create({
      data: { name: dto.name.trim(), slug },
    });
    const owner = await this.prisma.user.create({
      data: {
        companyId: company.id,
        name: dto.ownerName.trim(),
        email: ownerEmail,
        password: hashedPassword,
        role: 'ADMIN',
      },
      select: { id: true, name: true, email: true },
    });

    return { company, owner };
  }

  async toggleBlock(id: string, dto: ToggleBlockDto) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new BadRequestException('Loja não encontrada.');
    return this.prisma.company.update({ where: { id }, data: { isBlocked: dto.isBlocked } });
  }

  async resetOwnerPassword(companyId: string, dto: ResetOwnerPasswordDto) {
    const owner = await this.prisma.user.findFirst({
      where: { companyId, role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
    });
    if (!owner) throw new BadRequestException('Nenhum usuário dono (ADMIN) encontrado nesta loja.');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: owner.id }, data: { password: hashedPassword } });
    return { email: owner.email };
  }

  /**
   * Gera um token de login como o dono da loja — mesmo formato de payload
   * que o login normal (JwtStrategy espera {sub, email, companyId, role}).
   * Usado pelo painel agregador pra "Acessar Painel" sem precisar da senha.
   */
  async impersonateOwner(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new BadRequestException('Loja não encontrada.');

    const owner = await this.prisma.user.findFirst({
      where: { companyId, role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
    });
    if (!owner) throw new BadRequestException('Nenhum usuário dono (ADMIN) encontrado nesta loja.');

    const accessToken = this.jwt.sign(
      { sub: owner.id, email: owner.email, companyId: owner.companyId, role: owner.role },
      { expiresIn: '4h' },
    );

    return {
      accessToken,
      user: { id: owner.id, name: owner.name, email: owner.email, role: owner.role },
      company: { id: company.id, name: company.name, slug: company.slug, segment: company.segment },
    };
  }
}

// ─── Controller ───────────────────────────────────────────────────────────

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly svc: SuperAdminService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: SuperAdminLoginDto) {
    return this.svc.login(dto);
  }

  @UseGuards(SuperAdminGuard)
  @Get('companies')
  list() {
    return this.svc.listCompanies();
  }

  @UseGuards(SuperAdminGuard)
  @Post('companies')
  create(@Body() dto: CreateCompanyDto) {
    return this.svc.createCompany(dto);
  }

  @UseGuards(SuperAdminGuard)
  @Patch('companies/:id/block')
  toggleBlock(@Param('id') id: string, @Body() dto: ToggleBlockDto) {
    return this.svc.toggleBlock(id, dto);
  }

  @UseGuards(SuperAdminGuard)
  @Patch('companies/:id/reset-owner-password')
  resetOwnerPassword(@Param('id') id: string, @Body() dto: ResetOwnerPasswordDto) {
    return this.svc.resetOwnerPassword(id, dto);
  }

  @UseGuards(SuperAdminGuard)
  @Post('companies/:id/impersonate')
  impersonate(@Param('id') id: string) {
    return this.svc.impersonateOwner(id);
  }
}

// ─── Module ───────────────────────────────────────────────────────────────

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, SuperAdminGuard],
})
export class SuperAdminModule {}
