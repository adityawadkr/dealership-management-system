import { db } from '@/db';
import { quotations } from '@/db/schema';

async function main() {
    const sampleQuotations = [
        {
            number: 'Q2024-001',
            customer: 'John Smith',
            vehicle: 'Toyota RAV4 2023',
            amount: 35000,
            status: 'draft',
            createdAt: Math.floor(new Date('2024-12-05').getTime() / 1000),
        },
        {
            number: 'Q2024-002',
            customer: 'Sarah Johnson',
            vehicle: 'Honda CR-V 2024',
            amount: 42000,
            status: 'sent',
            createdAt: Math.floor(new Date('2024-12-10').getTime() / 1000),
        },
        {
            number: 'Q2024-003',
            customer: 'Michael Davis',
            vehicle: 'Ford Explorer 2022',
            amount: 28000,
            status: 'accepted',
            createdAt: Math.floor(new Date('2024-12-15').getTime() / 1000),
        },
        {
            number: 'Q2024-004',
            customer: 'Emily Rodriguez',
            vehicle: 'Chevrolet Tahoe 2023',
            amount: 58000,
            status: 'draft',
            createdAt: Math.floor(new Date('2024-12-18').getTime() / 1000),
        },
        {
            number: 'Q2024-005',
            customer: 'David Wilson',
            vehicle: 'Nissan Altima 2024',
            amount: 26500,
            status: 'sent',
            createdAt: Math.floor(new Date('2024-12-22').getTime() / 1000),
        },
        {
            number: 'Q2024-006',
            customer: 'Lisa Thompson',
            vehicle: 'Subaru Outback 2023',
            amount: 33500,
            status: 'accepted',
            createdAt: Math.floor(new Date('2024-12-28').getTime() / 1000),
        }
    ];

    await db.insert(quotations).values(sampleQuotations);
    
    console.log('✅ Quotations seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});