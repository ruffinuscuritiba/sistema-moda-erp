import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { NicheSeedService } from '../niche-seed/niche-seed.service';
import { SEGMENT_THEME } from '../niche-seed/niche-seed.data';
import { DEMO_NICHES } from '../niche-seed/demo-niche.data';
import { slugify } from '../../common/utils/slugify';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

const DEMO_USER_EMAIL = 'admin@modaerp.com.br';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private nicheSeed: NicheSeedService,
  ) {}

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'loja';
    let slug = base;
    let attempt = 1;
    while (await this.prisma.company.findUnique({ where: { slug } })) {
      attempt += 1;
      slug = `${base}-${attempt}`;
    }
    return slug;
  }

  async signup(dto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new BadRequestException('Este e-mail já está em uso.');

    const slug = await this.generateUniqueSlug(dto.companyName);
    const theme = SEGMENT_THEME[dto.segment];
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        slug,
        segment: dto.segment,
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        backgroundColor: theme.backgroundColor,
        darkMode: theme.darkMode,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        companyId: company.id,
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    // Não bloqueia a resposta — a loja aparece pronta no próximo refresh do painel.
    this.nicheSeed.seedForCompany(company.id, dto.segment).catch(() => {});

    return this.buildAuthResponse(user, company);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciais inválidas.');

    const validPassword = await bcrypt.compare(dto.password, user.password);
    if (!validPassword) throw new UnauthorizedException('Credenciais inválidas.');

    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) throw new UnauthorizedException('Empresa não encontrada.');
    if (company.isBlocked) throw new UnauthorizedException('Empresa bloqueada. Contate o suporte.');

    return this.buildAuthResponse(user, company);
  }

  /** Ver comentário no controller — entra direto na conta demo seedada, sem senha. */
  async demoAccess(niche?: string) {
    if (niche && DEMO_NICHES[niche]) {
      return this.demoAccessForNiche(niche);
    }

    const user = await this.prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
    if (!user || !user.isActive) throw new BadRequestException('Conta de demonstração indisponível no momento.');

    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) throw new BadRequestException('Empresa de demonstração indisponível no momento.');

    return this.buildAuthResponse(user, company);
  }

  /**
   * Demo temática por nicho (Ótica, Lingerie, Loja de Calçados, etc.) — cria
   * sob demanda na 1ª visita daquele slug (nome/cor/catálogo próprios, nunca
   * a conta genérica) e reaproveita depois. `companySlug`/`userEmail` são
   * determinísticos por nicho (definidos em DEMO_NICHES), então visitas
   * concorrentes ao mesmo nicho nunca duplicam a empresa.
   */
  private async demoAccessForNiche(niche: string) {
    const def = DEMO_NICHES[niche];

    let user = await this.prisma.user.findUnique({ where: { email: def.userEmail } });
    let company = user ? await this.prisma.company.findUnique({ where: { id: user.companyId } }) : null;

    if (!user || !company) {
      company =
        company ??
        (await this.prisma.company.findUnique({ where: { slug: def.companySlug } })) ??
        (await this.prisma.company.create({
          data: {
            name: def.companyName,
            slug: def.companySlug,
            segment: 'MODA',
            primaryColor: def.theme.primaryColor,
            secondaryColor: def.theme.secondaryColor,
            backgroundColor: def.theme.backgroundColor,
            darkMode: def.theme.darkMode,
          },
        }));

      const isNewCompany = await this.prisma.category.count({ where: { companyId: company.id } });

      user =
        user ??
        (await this.prisma.user.create({
          data: {
            companyId: company.id,
            name: 'Administrador',
            email: def.userEmail,
            password: await bcrypt.hash(`${def.userEmail}-${Date.now()}`, 10),
            role: 'ADMIN',
          },
        }));

      if (isNewCompany === 0) {
        await this.nicheSeed.seedCategories(company.id, def.categories).catch(() => {});
      }
    }

    if (!user.isActive) throw new BadRequestException('Conta de demonstração indisponível no momento.');
    return this.buildAuthResponse(user, company);
  }

  private buildAuthResponse(user: { id: string; name: string; email: string; role: string; companyId: string }, company: { id: string; name: string; slug: string; segment: string }) {
    const payload = { sub: user.id, email: user.email, companyId: user.companyId, role: user.role };
    const accessToken = this.jwt.sign(payload);

    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      company: { id: company.id, name: company.name, slug: company.slug, segment: company.segment },
    };
  }
}
