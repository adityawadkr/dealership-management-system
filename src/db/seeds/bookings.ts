import { db } from '@/db';
import { bookings } from '@/db/schema';

async function main() {
    const sampleBookings = [
        {
            customer: 'Rahul Mehta',
            vehicle: '2024 Maruti Suzuki Baleno',
            quotationNo: 'Q2024-001',
            date: '2024-12-28',
            status: 'booked',
            createdAt: Math.floor(new Date('2024-12-05').getTime() / 1000),
        },
        {
            customer: 'Kavita Iyer',
            vehicle: '2024 Honda City',
            quotationNo: 'Q2024-002',
            date: '2024-12-30',
            status: 'booked',
            createdAt: Math.floor(new Date('2024-12-10').getTime() / 1000),
        },
        {
            customer: 'Sanjay Gupta',
            vehicle: '2024 Tata Harrier',
            quotationNo: 'Q2024-003',
            date: '2024-11-25',
            status: 'cancelled',
            createdAt: Math.floor(new Date('2024-11-15').getTime() / 1000),
        },
        {
            customer: 'Pooja Nair',
            vehicle: '2024 Mahindra Scorpio-N',
            quotationNo: 'Q2024-004',
            date: '2024-12-02',
            status: 'cancelled',
            createdAt: Math.floor(new Date('2024-11-28').getTime() / 1000),
        },
        {
            customer: 'Arjun Verma',
            vehicle: '2024 Hyundai Venue',
            quotationNo: 'Q2024-005',
            date: '2024-11-30',
            status: 'delivered',
            createdAt: Math.floor(new Date('2024-11-20').getTime() / 1000),
        },
        {
            customer: 'Deepika Pillai',
            vehicle: '2024 Kia Sonet',
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