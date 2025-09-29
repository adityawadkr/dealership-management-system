import { db } from '@/db';
import { appointments } from '@/db/schema';

async function main() {
    const sampleAppointments = [
        {
            customer: 'Michael Rodriguez',
            vehicle: 'Toyota RAV4 2023',
            date: '2024-01-15T09:30:00.000Z',
            serviceType: 'Oil Change',
            status: 'completed',
            createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'Sarah Johnson',
            vehicle: 'Honda Accord 2024',
            date: '2024-01-22T14:00:00.000Z',
            serviceType: 'Brake Inspection',
            status: 'completed',
            createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'David Chen',
            vehicle: 'BMW X5 2023',
            date: '2024-01-28T11:15:00.000Z',
            serviceType: 'General Maintenance',
            status: 'completed',
            createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'Jennifer Williams',
            vehicle: 'Mercedes C-Class 2024',
            date: '2024-01-30T10:00:00.000Z',
            serviceType: 'Engine Diagnostics',
            status: 'in_progress',
            createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'Robert Martinez',
            vehicle: 'Ford F-150 2023',
            date: '2024-01-30T15:30:00.000Z',
            serviceType: 'Transmission Service',
            status: 'in_progress',
            createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'Amanda Thompson',
            vehicle: 'Audi A4 2024',
            date: '2024-02-02T08:45:00.000Z',
            serviceType: 'Tire Rotation',
            status: 'scheduled',
            createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'James Anderson',
            vehicle: 'Lexus RX 2023',
            date: '2024-02-05T13:20:00.000Z',
            serviceType: 'Oil Change',
            status: 'scheduled',
            createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        },
        {
            customer: 'Lisa Garcia',
            vehicle: 'Volkswagen Jetta 2024',
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