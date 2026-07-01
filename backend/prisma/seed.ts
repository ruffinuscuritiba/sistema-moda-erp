import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SEGMENT_DATA, SEGMENT_THEME } from '../src/modules/niche-seed/niche-seed.data';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@moda.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Seed já aplicado — usuário admin@moda.com já existe.');
    return;
  }

  const segment = 'MODA' as const;
  const theme = SEGMENT_THEME[segment];

  const company = await prisma.company.create({
    data: {
      name: 'Loja Demo Moda',
      slug: 'loja-demo-moda',
      segment,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      backgroundColor: theme.backgroundColor,
      darkMode: theme.darkMode,
    },
  });

  const password = await bcrypt.hash('123456', 10);
  await prisma.user.create({
    data: { companyId: company.id, name: 'Administrador', email, password, role: 'ADMIN' },
  });

  const categories = SEGMENT_DATA[segment];
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const category = await prisma.category.create({ data: { companyId: company.id, name: cat.name, sortOrder: i } });

    for (let j = 0; j < cat.products.length; j++) {
      const p = cat.products[j];
      const product = await prisma.product.create({
        data: {
          companyId: company.id,
          categoryId: category.id,
          name: p.name,
          costPrice: p.costPrice,
          salePrice: p.salePrice,
          isConsigned: p.isConsigned ?? false,
          sortOrder: j,
        },
      });

      for (const size of p.sizes) {
        for (const color of p.colors) {
          await prisma.productVariant.create({
            data: { productId: product.id, size, color, stock: 5, minimumStock: 2 },
          });
        }
      }
    }
  }

  console.log('Seed concluído:');
  console.log(`  Loja: ${company.name} (slug: ${company.slug})`);
  console.log(`  Login: ${email} / 123456`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
