import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { NicheSeedService } from '../niche-seed/niche-seed.service';
import { SEGMENT_THEME } from '../niche-seed/niche-seed.data';
import { slugify } from '../../common/utils/slugify';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

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
