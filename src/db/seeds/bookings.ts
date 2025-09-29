import { db } from '@/db';
import { bookings } from '@/db/schema';

async function main() {
    const sampleBookings = [
        {
            customer: 'Michael Rodriguez',
            vehicle: '2024 Toyota Camry LE',
            quotationNo: 'Q2024-001',
            date: '2024-12-28',
            status: 'booked',
            createdAt: Math.floor(new Date('2024-12-05').getTime() / 1000),
        },
        {
            customer: 'Sarah Chen',
            vehicle: '2024 Honda Accord Sport',
            quotationNo: 'Q2024-002',
            date: '2024-12-30',
            status: 'booked',
            createdAt: Math.floor(new Date('2024-12-10').getTime() / 1000),
        },
        {
            customer: 'David Thompson',
            vehicle: '2024 BMW X3 xDrive30i',
            quotationNo: 'Q2024-003',
            date: '2024-11-25',
            status: 'cancelled',
            createdAt: Math.floor(new Date('2024-11-15').getTime() / 1000),
        },
        {
            customer: 'Amanda Wilson',
            vehicle: '2024 Mercedes-Benz C-Class C300',
            quotationNo: 'Q2024-004',
            date: '2024-12-02',
            status: 'cancelled',
            createdAt: Math.floor(new Date('2024-11-28').getTime() / 1000),
        },
        {
            customer: 'James Patterson',
            vehicle: '2024 Ford F-150 Lariat',
            quotationNo: 'Q2024-005',
            date: '2024-11-30',
            status: 'delivered',
            createdAt: Math.floor(new Date('2024-11-20').getTime() / 1000),
        },
        {
            customer: 'Lisa Martinez',
            vehicle: '2024 Audi Q5 Premium Plus',
            quotationNo: 'Q2024-006',
            date: '2024-12-08',
            status: 'delivered',
            createdAt: Math.floor(new Date('2024-12-01').getTime() / 1000),
        }
    ];

    await db.insert(bookings).values(sampleBookings);
    
    console.log('✅ Bookings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});