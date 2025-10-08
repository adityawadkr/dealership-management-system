import { db } from '@/db';
import { leads } from '@/db/schema';

async function main() {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const sampleLeads = [
        {
            name: 'Rajesh Kumar',
            phone: '+91 98765 43210',
            email: 'rajesh.kumar@gmail.com',
            source: 'Website',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Priya Sharma',
            phone: '+91 99876 54321',
            email: 'priya.sharma@outlook.com',
            source: 'Ads',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Amit Patel',
            phone: '+91 97654 32109',
            email: 'amit.patel@yahoo.com',
            source: 'Walk-in',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Sneha Reddy',
            phone: '+91 96543 21098',
            email: 'sneha.reddy@gmail.com',
            source: 'Social Media',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Vikram Singh',
            phone: '+91 95432 10987',
            email: 'vikram.singh@techcorp.in',
            source: 'Referral',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Anita Desai',
            phone: '+91 94321 09876',
            email: 'anita.desai@outlook.com',
            source: 'Phone',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Rahul Mehta',
            phone: '+91 93210 98765',
            email: 'rahul.mehta@gmail.com',
            source: 'Ads',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Kavita Iyer',
            phone: '+91 92109 87654',
            email: 'kavita.iyer@yahoo.com',
            source: 'Website',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Sanjay Gupta',
            phone: '+91 91098 76543',
            email: 'sanjay.gupta@businesssolutions.in',
            source: 'Referral',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Pooja Nair',
            phone: '+91 90987 65432',
            email: 'pooja.nair@gmail.com',
            source: 'Social Media',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Arjun Verma',
            phone: '+91 89876 54321',
            email: 'arjun.verma@outlook.com',
            source: 'Walk-in',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Deepika Pillai',
            phone: '+91 88765 43210',
            email: 'deepika.pillai@yahoo.com',
            source: 'Phone',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Karan Malhotra',
            phone: '+91 87654 32109',
            email: 'karan.malhotra@innovatetech.in',
            source: 'Ads',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Meera Joshi',
            phone: '+91 86543 21098',
            email: 'meera.joshi@gmail.com',
            source: 'Website',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * (now - thirtyDaysAgo)),
        },
        {
            name: 'Aditya Rao',
            phone: '+91 85432 10987',
            email: 'aditya.rao@outlook.com',
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