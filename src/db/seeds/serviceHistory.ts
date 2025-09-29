import { db } from '@/db';
import { serviceHistory } from '@/db/schema';

async function main() {
    const sampleServiceHistory = [
        {
            customer: 'Sarah Johnson',
            vehicle: 'Toyota RAV4 2023',
            jobNo: 'JOB-001',
            date: '2024-07-15',
            amount: '249.99',
            createdAt: Math.floor(new Date('2024-12-01T09:30:00Z').getTime() / 1000),
        },
        {
            customer: 'Michael Chen',
            vehicle: 'Honda Accord 2024',
            jobNo: 'JOB-002',
            date: '2024-08-22',
            amount: '149.99',
            createdAt: Math.floor(new Date('2024-12-03T14:20:00Z').getTime() / 1000),
        },
        {
            customer: 'Emily Rodriguez',
            vehicle: 'Ford F-150 2022',
            jobNo: 'JOB-003',
            date: '2024-09-08',
            amount: '675.50',
            createdAt: Math.floor(new Date('2024-12-05T11:45:00Z').getTime() / 1000),
        },
        {
            customer: 'David Thompson',
            vehicle: 'Nissan Altima 2023',
            jobNo: 'JOB-004',
            date: '2024-09-30',
            amount: '89.50',
            createdAt: Math.floor(new Date('2024-12-07T16:15:00Z').getTime() / 1000),
        },
        {
            customer: 'Lisa Martinez',
            vehicle: 'Chevrolet Silverado 2024',
            jobNo: 'JOB-005',
            date: '2024-10-12',
            amount: '450.00',
            createdAt: Math.floor(new Date('2024-12-10T08:30:00Z').getTime() / 1000),
        },
        {
            customer: 'Robert Kim',
            vehicle: 'BMW X3 2023',
            jobNo: 'JOB-006',
            date: '2024-10-28',
            amount: '799.95',
            createdAt: Math.floor(new Date('2024-12-12T13:00:00Z').getTime() / 1000),
        },
        {
            customer: 'Jennifer Adams',
            vehicle: 'Mercedes-Benz C-Class 2024',
            jobNo: 'JOB-007',
            date: '2024-11-05',
            amount: '325.75',
            createdAt: Math.floor(new Date('2024-12-15T10:20:00Z').getTime() / 1000),
        },
        {
            customer: 'Kevin Wilson',
            vehicle: 'Hyundai Elantra 2023',
            jobNo: 'JOB-008',
            date: '2024-11-18',
            amount: '125.99',
            createdAt: Math.floor(new Date('2024-12-18T15:45:00Z').getTime() / 1000),
        },
        {
            customer: 'Amanda Foster',
            vehicle: 'Volkswagen Jetta 2024',
            jobNo: 'JOB-009',
            date: '2024-12-02',
            amount: '199.50',
            createdAt: Math.floor(new Date('2024-12-20T12:10:00Z').getTime() / 1000),
        },
        {
            customer: 'Christopher Lee',
            vehicle: 'Jeep Grand Cherokee 2023',
            jobNo: 'JOB-010',
            date: '2024-12-10',
            amount: '575.25',
            createdAt: Math.floor(new Date('2024-12-22T09:55:00Z').getTime() / 1000),
        }
    ];

    await db.insert(serviceHistory).values(sampleServiceHistory);
    
    console.log('✅ Service history seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});