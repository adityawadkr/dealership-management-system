import { db } from '@/db';
import { jobCards } from '@/db/schema';

async function main() {
    const baseTimestamp = Date.now();
    const daysInMs = 24 * 60 * 60 * 1000;

    const sampleJobCards = [
        {
            jobNo: 'JOB-001',
            appointmentId: 1,
            technician: 'Ravi Kumar',
            partsUsed: 'Oil Filter, Air Filter, Engine Oil',
            notes: 'Customer reported unusual noise during acceleration. Completed routine maintenance and addressed noise issue.',
            status: 'closed',
            createdAt: baseTimestamp - (15 * daysInMs),
        },
        {
            jobNo: 'JOB-002',
            appointmentId: 2,
            technician: 'Suresh Sharma',
            partsUsed: 'Brake Pads, Brake Fluid',
            notes: 'Replaced worn brake pads as requested. Customer satisfaction confirmed.',
            status: 'closed',
            createdAt: baseTimestamp - (12 * daysInMs),
        },
        {
            jobNo: 'JOB-003',
            appointmentId: 3,
            technician: 'Anil Patil',
            partsUsed: null,
            notes: null,
            status: 'open',
            createdAt: baseTimestamp - (8 * daysInMs),
        },
        {
            jobNo: 'JOB-004',
            appointmentId: null,
            technician: 'Ravi Kumar',
            partsUsed: 'Spark Plugs, Ignition Coils',
            notes: 'Routine maintenance completed successfully. All systems checked and verified.',
            status: 'closed',
            createdAt: baseTimestamp - (5 * daysInMs),
        },
        {
            jobNo: 'JOB-005',
            appointmentId: 5,
            technician: 'Suresh Sharma',
            partsUsed: 'Transmission Fluid, Transmission Filter',
            notes: null,
            status: 'open',
            createdAt: baseTimestamp - (3 * daysInMs),
        },
        {
            jobNo: 'JOB-006',
            appointmentId: null,
            technician: 'Anil Patil',
            partsUsed: 'Battery, Battery Terminals',
            notes: 'Customer reported starting issues. Replaced old battery and cleaned terminals.',
            status: 'open',
            createdAt: baseTimestamp - (1 * daysInMs),
        },
    ];

    await db.insert(jobCards).values(sampleJobCards);
    
    console.log('✅ Job cards seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});