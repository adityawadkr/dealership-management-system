import { db } from '@/db';
import { jobCards } from '@/db/schema';

async function main() {
    const sampleJobCards = [
        {
            jobNo: 'JOB-001',
            appointmentId: 1,
            technician: 'Mike Johnson',
            partsUsed: 'Oil Filter, Air Filter, Engine Oil',
            notes: 'Customer reported unusual noise during acceleration. Completed routine maintenance and addressed noise issue.',
            status: 'closed',
            createdAt: Math.floor(new Date('2024-11-15T09:30:00Z').getTime() / 1000),
        },
        {
            jobNo: 'JOB-002',
            appointmentId: 2,
            technician: 'Sarah Williams',
            partsUsed: 'Brake Pads, Brake Fluid',
            notes: 'Replaced worn brake pads as requested. Customer satisfaction confirmed.',
            status: 'closed',
            createdAt: Math.floor(new Date('2024-11-20T14:15:00Z').getTime() / 1000),
        },
        {
            jobNo: 'JOB-003',
            appointmentId: 3,
            technician: 'David Martinez',
            partsUsed: null,
            notes: 'Diagnostic check completed. Vehicle systems operating normally.',
            status: 'open',
            createdAt: Math.floor(new Date('2024-12-01T11:45:00Z').getTime() / 1000),
        },
        {
            jobNo: 'JOB-004',
            appointmentId: null,
            technician: 'Mike Johnson',
            partsUsed: 'Spark Plugs, Ignition Coils',
            notes: null,
            status: 'open',
            createdAt: Math.floor(new Date('2024-12-05T16:20:00Z').getTime() / 1000),
        },
        {
            jobNo: 'JOB-005',
            appointmentId: 5,
            technician: 'Sarah Williams',
            partsUsed: 'Transmission Fluid, Transmission Filter',
            notes: 'Routine maintenance completed successfully. All systems checked and verified.',
            status: 'closed',
            createdAt: Math.floor(new Date('2024-12-08T10:00:00Z').getTime() / 1000),
        },
        {
            jobNo: 'JOB-006',
            appointmentId: null,
            technician: 'David Martinez',
            partsUsed: 'Battery, Battery Terminals',
            notes: 'Customer reported starting issues. Replaced old battery and cleaned terminals.',
            status: 'open',
            createdAt: Math.floor(new Date('2024-12-12T13:30:00Z').getTime() / 1000),
        },
    ];

    await db.insert(jobCards).values(sampleJobCards);
    
    console.log('✅ Job cards seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});