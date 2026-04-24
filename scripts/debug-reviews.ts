import { prisma } from '../lib/prisma';
async function main() {
  const reviews = await prisma.review.findMany();
  console.log('Total reviews:', reviews.length);
  reviews.forEach(r => console.log(r.id, r.status, r.deletedAt, r.displayName));
}
main().catch(console.error).finally(() => prisma.$disconnect());
