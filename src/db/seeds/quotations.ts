import { db } from '@/db';
import { quotations } from '@/db/schema';

async function main() {
    const sampleQuotations = [
        {
            number: 'Q2024-001',
            customer: 'Rajesh Kumar',
            vehicle: 'Maruti Suzuki Swift 2024',
            amount: 850000,
            status: 'draft',
            createdAt: Math.floor(new Date('2024-12-05').getTime() / 1000),
        },
        {
            number: 'Q2024-002',
            customer: 'Priya Sharma',
            vehicle: 'Hyundai Creta 2024',
            amount: 1800000,
            status: 'sent',
            createdAt: Math.floor(new Date('2024-12-10').getTime() / 1000),
        },
        {
            number: 'Q2024-003',
            customer: 'Amit Patel',
            vehicle: 'Tata Nexon 2024',
            amount: 1200000,
            status: 'accepted',
            createdAt: Math.floor(new Date('2024-12-15').getTime() / 1000),
        },
        {
            number: 'Q2024-004',
            customer: 'Sneha Reddy',
            vehicle: 'Mahindra XUV700 2024',
            amount: 2500000,
            status: 'draft',
            createdAt: Math.floor(new Date('2024-12-18').getTime() / 1000),
        },
        {
            number: 'Q2024-005',
            customer: 'Vikram Singh',
            vehicle: 'Hyundai Verna 2024',
            amount: 1500000,
            status: 'sent',
            createdAt: Math.floor(new Date('2024-12-22').getTime() / 1000),
        },
        {
            number: 'Q2024-006',
            customer: 'Anita Desai',
            vehicle: 'Kia Seltos 2024',
            amount: 1900000,
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