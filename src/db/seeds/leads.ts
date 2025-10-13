import { db } from '@/db';
import { leads } from '@/db/schema';

async function main() {
    const now = Date.now();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    
    const sampleLeads = [
        {
            name: 'Rajesh Kumar',
            phone: '+91 98765 43210',
            email: 'rajesh.kumar@gmail.com',
            source: 'Website',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Priya Sharma',
            phone: '+91 99876 54321',
            email: 'priya.sharma@techcorp.in',
            source: 'Social Media',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Amit Patel',
            phone: '+91 97654 32109',
            email: 'amit.patel@outlook.com',
            source: 'Ads',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Sneha Reddy',
            phone: '+91 96543 21098',
            email: 'sneha.reddy@yahoo.com',
            source: 'Referral',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Vikram Singh',
            phone: '+91 95432 10987',
            email: 'vikram.singh@businesssolutions.in',
            source: 'Walk-in',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Anita Desai',
            phone: '+91 94321 09876',
            email: 'anita.desai@gmail.com',
            source: 'Phone',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Rahul Mehta',
            phone: '+91 93210 98765',
            email: 'rahul.mehta@innovatetech.in',
            source: 'Website',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Kavita Iyer',
            phone: '+91 92109 87654',
            email: 'kavita.iyer@outlook.com',
            source: 'Social Media',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Sanjay Gupta',
            phone: '+91 91098 76543',
            email: 'sanjay.gupta@gmail.com',
            source: 'Ads',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Pooja Nair',
            phone: '+91 90987 65432',
            email: 'pooja.nair@techcorp.in',
            source: 'Referral',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Arjun Verma',
            phone: '+91 89876 54321',
            email: 'arjun.verma@yahoo.com',
            source: 'Walk-in',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Deepika Pillai',
            phone: '+91 88765 43210',
            email: 'deepika.pillai@businesssolutions.in',
            source: 'Phone',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Karan Malhotra',
            phone: '+91 87654 32109',
            email: 'karan.malhotra@gmail.com',
            source: 'Website',
            status: 'new',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Meera Joshi',
            phone: '+91 86543 21098',
            email: 'meera.joshi@innovatetech.in',
            source: 'Social Media',
            status: 'contacted',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        },
        {
            name: 'Aditya Rao',
            phone: '+91 85432 10987',
            email: 'aditya.rao@outlook.com',
            source: 'Ads',
            status: 'qualified',
            createdAt: now - Math.floor(Math.random() * thirtyDaysInMs),
        }
    ];

    await db.insert(leads).values(sampleLeads);
    
    console.log('✅ Leads seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});