import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        users: {
          select: {
            id: true,
            username: true,
            isCredentialsChanged: true
          }
        }
      }
    })
    console.log('Suppliers found:', suppliers.length)
    if (suppliers.length > 0) {
      console.log('First supplier:', JSON.stringify(suppliers[0], null, 2))
    }
  } catch (error) {
    console.error('Error fetching suppliers:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
