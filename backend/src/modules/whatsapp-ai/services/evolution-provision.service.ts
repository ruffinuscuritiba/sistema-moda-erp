import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EvolutionClientService, EvolutionCreds } from './evolution-client.service';

/**
 * Prefixo obrigatório de toda instância criada por este projeto no servidor
 * Evolution compartilhado entre as verticais (food-system usa `kely-`, oficina
 * usará `oficina-`). Nenhum comando destrutivo sai sem essa checagem.
 */
const INSTANCE_PREFIX = 'moda-';

@Injectable()
export class EvolutionProvisionService {
  private readonly log = new Logger(EvolutionProvisionService.name);

  constructor(
    private prisma: PrismaService,
    private client: EvolutionClientService,
  ) {}

  private get baseUrl(): string {
    return (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '');
  }

  private get masterKey(): string {
    return process.env.EVOLUTION_API_KEY ?? '';
  }

  private get backendUrl(): string {
    return (process.env.BACKEND_URL ?? '').replace(/\/$/, '');
  }

  get isConfigured(): boolean {
    return !!this.baseUrl && !!this.masterKey;
  }

  private credsFor(connection: { apiUrl: string | null; apiToken: string | null }): EvolutionCreds {
    return {
      baseUrl: connection.apiUrl || this.baseUrl,
      apiKey: connection.apiToken || this.masterKey,
    };
  }

  listConnections(companyId: string) {
    return this.prisma.whatsappConnection.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  }

  async provisionConnection(companyId: string, name: string) {
    if (!this.isConfigured) {
      throw new BadRequestException(
        'Evolution API não configurada neste ambiente (EVOLUTION_API_URL/EVOLUTION_API_KEY).',
      );
    }
    if (!this.backendUrl) {
      throw new BadRequestException('BACKEND_URL não configurada — necessária para registrar o webhook.');
    }

    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { slug: true } });
    if (!company) throw new NotFoundException('Loja não encontrada.');

    const instanceName = `${INSTANCE_PREFIX}${company.slug}-${companyId.slice(0, 8)}-${Date.now().toString(36)}`;
    this.assertModaPrefix(instanceName);

    const connection = await this.prisma.whatsappConnection.create({
      data: { companyId, name, instanceName, isActive: false },
    });

    const creds: EvolutionCreds = { baseUrl: this.baseUrl, apiKey: this.masterKey };
    try {
      await this.client.createInstance(creds, instanceName);
      await this.client.setWebhook(creds, instanceName, `${this.backendUrl}/api/whatsapp-ai/webhook/${connection.id}`);
    } catch (err: any) {
      await this.prisma.whatsappConnection.delete({ where: { id: connection.id } }).catch(() => {});
      throw new BadRequestException(`Falha ao provisionar conexão WhatsApp: ${err?.message ?? err}`);
    }

    return connection;
  }

  async getConnectionQr(companyId: string, connectionId: string) {
    const connection = await this.findOwned(companyId, connectionId);
    if (!connection.instanceName) throw new BadRequestException('Conexão sem instância provisionada.');

    const creds = this.credsFor(connection);
    const state = await this.client.getState(creds, connection.instanceName);

    if (state === 'open') {
      if (!connection.isActive) {
        const phoneNumber = await this.client.getPhoneNumber(creds, connection.instanceName);
        await this.prisma.whatsappConnection.update({
          where: { id: connection.id },
          data: { isActive: true, phoneNumber },
        });
      }
      return { state, qrCode: null, isActive: true };
    }

    const qrCode = await this.client.getQrCode(creds, connection.instanceName);
    return { state, qrCode, isActive: false };
  }

  async deleteConnection(companyId: string, connectionId: string) {
    const connection = await this.findOwned(companyId, connectionId);

    if (connection.instanceName) {
      this.assertModaPrefix(connection.instanceName);
      await this.client.deleteInstance(this.credsFor(connection), connection.instanceName).catch((err) => {
        this.log.warn(`Falha ao deletar instância Evolution ${connection.instanceName}: ${err?.message ?? err}`);
      });
    }

    await this.prisma.whatsappConnection.delete({ where: { id: connection.id } });
    return { success: true };
  }

  private async findOwned(companyId: string, connectionId: string) {
    const connection = await this.prisma.whatsappConnection.findFirst({ where: { id: connectionId, companyId } });
    if (!connection) throw new NotFoundException('Conexão não encontrada.');
    return connection;
  }

  /** Nunca permite comando destrutivo em instância de outro projeto no servidor Evolution compartilhado. */
  private assertModaPrefix(instanceName: string) {
    if (!instanceName.startsWith(INSTANCE_PREFIX)) {
      throw new BadRequestException('Instância fora do escopo da Moda — operação bloqueada por segurança.');
    }
  }
}
