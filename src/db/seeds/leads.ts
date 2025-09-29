import { db } from '@/db';
import { leads } from '@/db/schema';

async function main() {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const sampleLeads = [
        {
            name: 'John Smith',
            phone: '(555) 123-4567',
            email: 'john.smith@gmail.com',
            source: 'Website',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Sarah Johnson',
            phone: '555-234-5678',
            email: 'sarah.johnson@outlook.com',
            source: 'Ads',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Michael Davis',
            phone: '(555) 345-6789',
            email: 'mike.davis@yahoo.com',
            source: 'Walk-in',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Emily Rodriguez',
            phone: '555-456-7890',
            email: 'emily.rodriguez@gmail.com',
            source: 'Social Media',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'David Wilson',
            phone: '(555) 567-8901',
            email: 'david.wilson@techcorp.com',
            source: 'Referral',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Lisa Anderson',
            phone: '555-678-9012',
            email: 'lisa.anderson@outlook.com',
            source: 'Phone',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Robert Martinez',
            phone: '(555) 789-0123',
            email: 'robert.martinez@gmail.com',
            source: 'Ads',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Jennifer Brown',
            phone: '555-890-1234',
            email: 'jennifer.brown@yahoo.com',
            source: 'Website',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Christopher Lee',
            phone: '(555) 901-2345',
            email: 'chris.lee@businesssolutions.com',
            source: 'Referral',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Amanda Taylor',
            phone: '555-012-3456',
            email: 'amanda.taylor@gmail.com',
            source: 'Social Media',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Kevin White',
            phone: '(555) 123-7890',
            email: 'kevin.white@outlook.com',
            source: 'Walk-in',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Michelle Garcia',
            phone: '555-234-8901',
            email: 'michelle.garcia@yahoo.com',
            source: 'Phone',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Daniel Thomas',
            phone: '(555) 345-9012',
            email: 'daniel.thomas@innovatetech.com',
            source: 'Ads',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Jessica Clark',
            phone: '555-456-0123',
            email: 'jessica.clark@gmail.com',
            source: 'Website',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Matthew Lewis',
            phone: '(555) 567-1234',
            email: 'matthew.lewis@outlook.com',
            source: 'Referral',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
    ];

    await db.insert(leads).values(sampleLeads);
    
    console.log('✅ Leads seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});