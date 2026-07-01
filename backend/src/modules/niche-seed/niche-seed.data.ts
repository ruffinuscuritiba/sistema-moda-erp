import { Segment } from '@prisma/client';

export interface SeedProduct {
  name: string;
  costPrice: number;
  salePrice: number;
  isConsigned?: boolean;
  sizes: string[];
  colors: string[];
}

export interface SeedCategory {
  name: string;
  products: SeedProduct[];
}

export interface SegmentTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  darkMode: boolean;
}

/** Tema padrão sugerido por nicho — o lojista pode trocar depois em Configurações. */
export const SEGMENT_THEME: Record<Segment, SegmentTheme> = {
  BRECHO: {
    primaryColor: '#b45309', // âmbar terroso — "desapego chique"
    secondaryColor: '#44403c',
    backgroundColor: '#fefaf6',
    darkMode: false,
  },
  DEPARTAMENTO: {
    primaryColor: '#4f46e5', // índigo — Tech Clean / robustez
    secondaryColor: '#0f172a',
    backgroundColor: '#f8fafc',
    darkMode: false,
  },
  MODA: {
    primaryColor: '#b8860b', // dourado — Premium Minimalist
    secondaryColor: '#111827',
    backgroundColor: '#fafafa',
    darkMode: false,
  },
};

export const SEGMENT_LABEL: Record<Segment, string> = {
  BRECHO: 'Brechó',
  DEPARTAMENTO: 'Loja de Departamento',
  MODA: 'Moda / Grandes Marcas',
};

export const SEGMENT_DATA: Record<Segment, SeedCategory[]> = {
  BRECHO: [
    {
      name: 'Vestidos',
      products: [
        { name: 'Vestido Midi Floral', costPrice: 25, salePrice: 79.9, isConsigned: true, sizes: ['P', 'M', 'G'], colors: ['Único'] },
        { name: 'Vestido Longo Vintage', costPrice: 35, salePrice: 119.9, isConsigned: true, sizes: ['P', 'M'], colors: ['Único'] },
      ],
    },
    {
      name: 'Blusas',
      products: [
        { name: 'Blusa de Seda Estampada', costPrice: 15, salePrice: 49.9, isConsigned: true, sizes: ['P', 'M', 'G'], colors: ['Único'] },
      ],
    },
    {
      name: 'Calças',
      products: [
        { name: 'Calça Jeans Mom', costPrice: 20, salePrice: 69.9, isConsigned: true, sizes: ['36', '38', '40'], colors: ['Azul'] },
      ],
    },
    {
      name: 'Acessórios',
      products: [
        { name: 'Bolsa de Couro Retrô', costPrice: 30, salePrice: 99.9, isConsigned: true, sizes: ['Único'], colors: ['Caramelo'] },
      ],
    },
  ],
  DEPARTAMENTO: [
    {
      name: 'Feminino',
      products: [
        { name: 'Blusa Básica Feminina', costPrice: 18, salePrice: 39.9, sizes: ['P', 'M', 'G', 'GG'], colors: ['Branco', 'Preto'] },
        { name: 'Calça Legging', costPrice: 22, salePrice: 49.9, sizes: ['P', 'M', 'G'], colors: ['Preto'] },
      ],
    },
    {
      name: 'Masculino',
      products: [
        { name: 'Camiseta Básica', costPrice: 15, salePrice: 34.9, sizes: ['P', 'M', 'G', 'GG'], colors: ['Branco', 'Cinza', 'Preto'] },
        { name: 'Bermuda Sarja', costPrice: 25, salePrice: 59.9, sizes: ['38', '40', '42', '44'], colors: ['Bege'] },
      ],
    },
    {
      name: 'Infantil',
      products: [
        { name: 'Conjunto Infantil', costPrice: 20, salePrice: 49.9, sizes: ['2', '4', '6', '8'], colors: ['Azul'] },
      ],
    },
    {
      name: 'Casa',
      products: [
        { name: 'Jogo de Toalhas', costPrice: 30, salePrice: 69.9, sizes: ['Único'], colors: ['Branco'] },
      ],
    },
  ],
  MODA: [
    {
      name: 'Novidades',
      products: [
        { name: 'Vestido de Alfaiataria', costPrice: 90, salePrice: 349.9, sizes: ['P', 'M', 'G'], colors: ['Preto'] },
      ],
    },
    {
      name: 'Grife Feminina',
      products: [
        { name: 'Blazer Premium', costPrice: 120, salePrice: 449.9, sizes: ['P', 'M', 'G'], colors: ['Preto', 'Bege'] },
        { name: 'Calça Alfaiataria', costPrice: 80, salePrice: 299.9, sizes: ['36', '38', '40'], colors: ['Preto'] },
      ],
    },
    {
      name: 'Grife Masculina',
      products: [
        { name: 'Camisa Social Premium', costPrice: 70, salePrice: 259.9, sizes: ['P', 'M', 'G', 'GG'], colors: ['Branco', 'Azul'] },
      ],
    },
    {
      name: 'Acessórios de Luxo',
      products: [
        { name: 'Cinto de Couro Legítimo', costPrice: 50, salePrice: 189.9, sizes: ['Único'], colors: ['Preto'] },
      ],
    },
  ],
};
