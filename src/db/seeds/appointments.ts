import { db } from '@/db';
import { appointments } from '@/db/schema';

async function main() {
    const sampleAppointments = [
        {
            customer: 'Rajesh Kumar',
            vehicle: 'Maruti Suzuki Swift 2023',
            date: new Date('2024-01-15T10:00:00.000Z').toISOString(),
            serviceType: 'Oil Change',
            status: 'completed',
            createdAt: Date.now() - (20 * 24 * 60 * 60 * 1000),
        },
        {
            customer: 'Priya Sharma',
            vehicle: 'Hyundai Creta 2024',
            date: new Date('2024-01-22T14:30:00.000Z').toISOString(),
            serviceType: 'General Maintenance',
            status: 'completed',
            createdAt: Date.now() - (15 * 24 * 60 * 60 * 1000),
        },
        {
            customer: 'Amit Patel',
            vehicle: 'Tata Nexon 2023',
            date: new Date('2024-01-28T09:00:00.000Z').toISOString(),
            serviceType: 'Brake Inspection',
            status: 'completed',
            createdAt: Date.now() - (10 * 24 * 60 * 60 * 1000),
        },
        {
            customer: 'Sneha Reddy',
            vehicle: 'Mahindra XUV700 2024',
            date: new Date('2024-02-05T11:00:00.000Z').toISOString(),
            serviceType: 'Engine Diagnostics',
            status: 'in_progress',
            createdAt: Date.now() - (5 * 24 * 60 * 60 * 1000),
        },
        {
            customer: 'Vikram Singh',
            vehicle: 'Mahindra Thar 2023',
            date: new Date('2024-02-08T15:30:00.000Z').toISOString(),
            serviceType: 'Transmission Service',
            status: 'in_progress',
            createdAt: Date.now() - (3 * 24 * 60 * 60 * 1000),
        },
        {
            customer: 'Anita Desai',
            vehicle: 'Kia Seltos 2024',
            date: new Date('2024-02-12T10:30:00.000Z').toISOString(),
            serviceType: 'Tire Rotation',
            status: 'scheduled',
            createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
        },
        {
            customer: 'Rahul Mehta',
            vehicle: 'Honda City 2023',
            date: new Date('2024-02-18T13:00:00.000Z').toISOString(),
            serviceType: 'Oil Change',
            status: 'scheduled',
            createdAt: Date.now() - (1 * 24 * 60 * 60 * 1000),
        },
        {
            customer: 'Kavita Iyer',
            vehicle: 'Tata Altroz 2024',
            date: new Date('2024-02-25T16:00:00.000Z').toISOString(),
            serviceType: 'General Maintenance',
            status: 'scheduled',
            createdAt: Date.now(),
        },
    ];

    await db.insert(appointments).values(sampleAppointments);
    
    console.log('✅ Appointments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});