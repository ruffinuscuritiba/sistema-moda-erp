import { SeedCategory, SegmentTheme } from './niche-seed.data';

export interface DemoNicheDef {
  companyName: string;
  companySlug: string;
  userEmail: string;
  theme: SegmentTheme;
  categories: SeedCategory[];
}

/**
 * Demos temáticas do hub /demo do R_FoodSaaS ("Segmentos Atendidos" → macro
 * Moda). Cada tag lá (Loja de Roupas, Ótica, Lingerie, ...) manda um `?niche=`
 * pra cá — sem isso, todo clique caía na mesma conta genérica "Loja Demo
 * Moda", com o mesmo nome/produtos/cor não importa o nicho escolhido.
 *
 * Cada entrada aqui é uma empresa demo própria (nome, cor, catálogo — nunca
 * reaproveita a conta genérica), criada sob demanda na 1ª visita daquele
 * nicho e reaproveitada depois (mesmo padrão idempotente de seedForCompany).
 * Cores alinhadas com SUBTAG_COLOR do frontend do R_FoodSaaS, pra manter a
 * identidade visual da tag consistente do clique até dentro do painel.
 */
export const DEMO_NICHES: Record<string, DemoNicheDef> = {
  roupas: {
    companyName: 'Studio Fashion Roupas',
    companySlug: 'demo-loja-de-roupas',
    userEmail: 'demo-roupas@modaerp.com.br',
    theme: { primaryColor: '#6366f1', secondaryColor: '#312e81', backgroundColor: '#f8fafc', darkMode: false },
    categories: [
      {
        name: 'Femininas',
        products: [
          { name: 'Vestido Midi Estampado', costPrice: 35, salePrice: 129.9, sizes: ['P', 'M', 'G'], colors: ['Floral', 'Liso'] },
          { name: 'Blusa Cropped Canelada', costPrice: 18, salePrice: 59.9, sizes: ['P', 'M', 'G'], colors: ['Preto', 'Branco'] },
        ],
      },
      {
        name: 'Masculinas',
        products: [
          { name: 'Camisa Casual Slim', costPrice: 30, salePrice: 99.9, sizes: ['P', 'M', 'G', 'GG'], colors: ['Azul', 'Branco'] },
          { name: 'Bermuda Jeans', costPrice: 25, salePrice: 89.9, sizes: ['38', '40', '42', '44'], colors: ['Azul'] },
        ],
      },
    ],
  },
  calcados: {
    companyName: 'Passo Certo Calçados',
    companySlug: 'demo-loja-de-calcados',
    userEmail: 'demo-calcados@modaerp.com.br',
    theme: { primaryColor: '#a16207', secondaryColor: '#451a03', backgroundColor: '#fdf8f0', darkMode: false },
    categories: [
      {
        name: 'Tênis',
        products: [
          { name: 'Tênis Casual Branco', costPrice: 60, salePrice: 189.9, sizes: ['36', '38', '40', '42'], colors: ['Branco'] },
          { name: 'Tênis Esportivo Running', costPrice: 80, salePrice: 249.9, sizes: ['38', '40', '42', '44'], colors: ['Preto', 'Cinza'] },
        ],
      },
      {
        name: 'Sapatos Sociais',
        products: [
          { name: 'Sapato Social Couro', costPrice: 70, salePrice: 219.9, sizes: ['39', '41', '43'], colors: ['Preto', 'Marrom'] },
          { name: 'Sandália Salto Bloco', costPrice: 40, salePrice: 139.9, sizes: ['35', '37', '39'], colors: ['Nude'] },
        ],
      },
    ],
  },
  lingerie: {
    companyName: 'Charme Íntimo Lingerie',
    companySlug: 'demo-lingerie-pecas-intimas',
    userEmail: 'demo-lingerie@modaerp.com.br',
    theme: { primaryColor: '#f43f5e', secondaryColor: '#881337', backgroundColor: '#fff5f6', darkMode: false },
    categories: [
      {
        name: 'Sutiãs',
        products: [
          { name: 'Sutiã em Renda sem Bojo', costPrice: 20, salePrice: 69.9, sizes: ['P', 'M', 'G'], colors: ['Preto', 'Nude'] },
          { name: 'Sutiã Push-up', costPrice: 22, salePrice: 79.9, sizes: ['P', 'M', 'G'], colors: ['Vinho', 'Preto'] },
        ],
      },
      {
        name: 'Calcinhas & Conjuntos',
        products: [
          { name: 'Calcinha Biquíni em Renda', costPrice: 8, salePrice: 29.9, sizes: ['P', 'M', 'G'], colors: ['Preto', 'Branco'] },
          { name: 'Conjunto Body em Renda', costPrice: 28, salePrice: 99.9, sizes: ['P', 'M', 'G'], colors: ['Vermelho'] },
        ],
      },
    ],
  },
  infantil: {
    companyName: 'Pequenos Estilos Kids',
    companySlug: 'demo-modas-infantil',
    userEmail: 'demo-infantil@modaerp.com.br',
    theme: { primaryColor: '#facc15', secondaryColor: '#713f12', backgroundColor: '#fffdf5', darkMode: false },
    categories: [
      {
        name: 'Meninas',
        products: [
          { name: 'Vestido Infantil Floral', costPrice: 20, salePrice: 69.9, sizes: ['2', '4', '6', '8'], colors: ['Rosa', 'Amarelo'] },
          { name: 'Conjunto Legging Infantil', costPrice: 15, salePrice: 49.9, sizes: ['2', '4', '6'], colors: ['Lilás'] },
        ],
      },
      {
        name: 'Meninos',
        products: [
          { name: 'Camiseta Estampada Infantil', costPrice: 12, salePrice: 34.9, sizes: ['2', '4', '6', '8'], colors: ['Azul', 'Verde'] },
          { name: 'Bermuda Moletom Infantil', costPrice: 14, salePrice: 44.9, sizes: ['4', '6', '8'], colors: ['Cinza'] },
        ],
      },
    ],
  },
  acessorios: {
    companyName: 'Brilho & Cia Acessórios',
    companySlug: 'demo-acessorios-bijouterias',
    userEmail: 'demo-acessorios@modaerp.com.br',
    theme: { primaryColor: '#eab308', secondaryColor: '#713f12', backgroundColor: '#fffbea', darkMode: false },
    categories: [
      {
        name: 'Bijuterias',
        products: [
          { name: 'Colar Banhado a Ouro', costPrice: 15, salePrice: 59.9, sizes: ['Único'], colors: ['Dourado'] },
          { name: 'Brinco Argola Cristal', costPrice: 10, salePrice: 39.9, sizes: ['Único'], colors: ['Prateado'] },
        ],
      },
      {
        name: 'Bolsas & Cintos',
        products: [
          { name: 'Bolsa Tiracolo Couro Sintético', costPrice: 35, salePrice: 129.9, sizes: ['Único'], colors: ['Preto', 'Caramelo'] },
          { name: 'Cinto de Couro Fino', costPrice: 12, salePrice: 44.9, sizes: ['Único'], colors: ['Preto'] },
        ],
      },
    ],
  },
  boutique: {
    companyName: 'Atelier Boutique Exclusiva',
    companySlug: 'demo-boutique-exclusiva',
    userEmail: 'demo-boutique@modaerp.com.br',
    theme: { primaryColor: '#c026d3', secondaryColor: '#4a044e', backgroundColor: '#fdf7fe', darkMode: false },
    categories: [
      {
        name: 'Peças Autorais',
        products: [
          { name: 'Vestido de Festa Longo', costPrice: 150, salePrice: 599.9, sizes: ['P', 'M', 'G'], colors: ['Preto', 'Vinho'] },
          { name: 'Blazer Alfaiataria Premium', costPrice: 110, salePrice: 429.9, sizes: ['P', 'M', 'G'], colors: ['Bege'] },
        ],
      },
      {
        name: 'Edição Limitada',
        products: [
          { name: 'Conjunto Seda Importado', costPrice: 130, salePrice: 489.9, sizes: ['P', 'M'], colors: ['Champagne'] },
          { name: 'Casaco Tweed', costPrice: 140, salePrice: 549.9, sizes: ['P', 'M', 'G'], colors: ['Rosa Claro'] },
        ],
      },
    ],
  },
  otica: {
    companyName: 'Visão Clara Ótica',
    companySlug: 'demo-otica',
    userEmail: 'demo-otica@modaerp.com.br',
    theme: { primaryColor: '#0ea5e9', secondaryColor: '#0c4a6e', backgroundColor: '#f0f9ff', darkMode: false },
    categories: [
      {
        name: 'Óculos de Sol',
        products: [
          { name: 'Óculos de Sol Aviador', costPrice: 40, salePrice: 149.9, sizes: ['Único'], colors: ['Dourado', 'Preto'] },
          { name: 'Óculos de Sol Quadrado Polarizado', costPrice: 45, salePrice: 169.9, sizes: ['Único'], colors: ['Preto'] },
        ],
      },
      {
        name: 'Óculos de Grau',
        products: [
          { name: 'Armação Acetato Redonda', costPrice: 35, salePrice: 129.9, sizes: ['Único'], colors: ['Tartaruga'] },
          { name: 'Armação Metal Retangular', costPrice: 38, salePrice: 139.9, sizes: ['Único'], colors: ['Prata'] },
        ],
      },
    ],
  },
};
