import { db } from '@/db';
import { appointments } from '@/db/schema';

async function main() {
    const sampleAppointments = [
        {
            customer: 'Rajesh Kumar',
            vehicle: 'Maruti Suzuki Swift 2023',
            date: '2024-01-15T09:30:00.000Z',
            serviceType: 'Oil Change',
            status: 'completed',
            createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'Priya Sharma',
            vehicle: 'Hyundai Creta 2024',
            date: '2024-01-22T14:00:00.000Z',
            serviceType: 'Brake Inspection',
            status: 'completed',
            createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'Amit Patel',
            vehicle: 'Tata Nexon 2023',
            date: '2024-01-28T11:15:00.000Z',
            serviceType: 'General Maintenance',
            status: 'completed',
            createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'Sneha Reddy',
            vehicle: 'Mahindra XUV700 2024',
            date: '2024-01-30T10:00:00.000Z',
            serviceType: 'Engine Diagnostics',
            status: 'in_progress',
            createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'Vikram Singh',
            vehicle: 'Mahindra Thar 2023',
            date: '2024-01-30T15:30:00.000Z',
            serviceType: 'Transmission Service',
            status: 'in_progress',
            createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'Anita Desai',
            vehicle: 'Kia Seltos 2024',
            date: '2024-02-02T08:45:00.000Z',
            serviceType: 'Tire Rotation',
            status: 'scheduled',
            createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'Rahul Mehta',
            vehicle: 'Honda City 2023',
            date: '2024-02-05T13:20:00.000Z',
            serviceType: 'Oil Change',
            status: 'scheduled',
            createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'Kavita Iyer',
            vehicle: 'Tata Altroz 2024',
            date: '2024-02-08T16:00:00.000Z',
            serviceType: 'Brake Inspection',
            status: 'scheduled',
            createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        },
    ];

    await db.insert(appointments).values(sampleAppointments);
    
    console.log('✅ Appointments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});