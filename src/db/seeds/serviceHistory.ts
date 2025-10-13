import { db } from '@/db';
import { serviceHistory } from '@/db/schema';

async function main() {
    const sampleServiceHistory = [
        {
            customer: 'Rajesh Kumar',
            vehicle: 'Maruti Suzuki Swift 2023',
            jobNo: 'JOB-001',
            date: '2024-07-15',
            amount: '12500',
            createdAt: Math.floor(new Date('2024-07-15T10:30:00Z').getTime() / 1000),
        },
        {
            customer: 'Priya Sharma',
            vehicle: 'Hyundai Creta 2024',
            jobNo: 'JOB-002',
            date: '2024-08-22',
            amount: '8500',
            createdAt: Math.floor(new Date('2024-08-22T11:15:00Z').getTime() / 1000),
        },
        {
            customer: 'Amit Patel',
            vehicle: 'Mahindra Thar 2022',
            jobNo: 'JOB-003',
            date: '2024-09-08',
            amount: '35000',
            createdAt: Math.floor(new Date('2024-09-08T09:45:00Z').getTime() / 1000),
        },
        {
            customer: 'Sneha Reddy',
            vehicle: 'Tata Nexon 2023',
            jobNo: 'JOB-004',
            date: '2024-09-30',
            amount: '4500',
            createdAt: Math.floor(new Date('2024-09-30T14:20:00Z').getTime() / 1000),
        },
        {
            customer: 'Vikram Singh',
            vehicle: 'Mahindra Scorpio-N 2024',
            jobNo: 'JOB-005',
            date: '2024-10-12',
            amount: '22000',
            createdAt: Math.floor(new Date('2024-10-12T08:30:00Z').getTime() / 1000),
        },
        {
            customer: 'Anita Desai',
            vehicle: 'Kia Seltos 2023',
            jobNo: 'JOB-006',
            date: '2024-10-28',
            amount: '18500',
            createdAt: Math.floor(new Date('2024-10-28T13:45:00Z').getTime() / 1000),
        },
        {
            customer: 'Rahul Mehta',
            vehicle: 'Honda City 2024',
            jobNo: 'JOB-007',
            date: '2024-11-05',
            amount: '15000',
            createdAt: Math.floor(new Date('2024-11-05T10:00:00Z').getTime() / 1000),
        },
        {
            customer: 'Kavita Iyer',
            vehicle: 'Hyundai i20 2023',
            jobNo: 'JOB-008',
            date: '2024-11-18',
            amount: '6500',
            createdAt: Math.floor(new Date('2024-11-18T15:30:00Z').getTime() / 1000),
        },
        {
            customer: 'Sanjay Gupta',
            vehicle: 'Tata Altroz 2024',
            jobNo: 'JOB-009',
            date: '2024-12-02',
            amount: '9800',
            createdAt: Math.floor(new Date('2024-12-02T11:45:00Z').getTime() / 1000),
        },
        {
            customer: 'Pooja Nair',
            vehicle: 'Mahindra XUV700 2023',
            jobNo: 'JOB-010',
            date: '2024-12-10',
            amount: '28000',
            createdAt: Math.floor(new Date('2024-12-10T09:15:00Z').getTime() / 1000),
        }
    ];

    await db.insert(serviceHistory).values(sampleServiceHistory);
    
    console.log('✅ Service history seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});