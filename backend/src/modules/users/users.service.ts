import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const SELECT = { id: true, name: true, email: true, role: true, isActive: true, createdAt: true };

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByCompany(companyId: string) {
    return this.prisma.user.findMany({ where: { companyId }, select: SELECT, orderBy: { createdAt: 'asc' } });
  }

  async create(companyId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Este e-mail já está em uso.');

    const password = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: { companyId, name: dto.name, email: dto.email, password, role: dto.role },
      select: SELECT,
    });
  }

  async update(companyId: string, id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id, companyId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return this.prisma.user.update({ where: { id }, data: dto, select: SELECT });
  }

  async remove(companyId: string, id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, companyId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
