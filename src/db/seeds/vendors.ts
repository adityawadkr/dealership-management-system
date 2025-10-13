import { db } from '@/db';
import { vendors } from '@/db/schema';

async function main() {
    const sampleVendors = [
        {
            name: 'Genuine Parts India Pvt Ltd',
            contactPerson: 'Rajesh Kumar',
            phone: '+91 22 4567 8901',
            email: 'contact@genuinepartsindia.com',
            address: 'Plot No. 45, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra - 400093',
            paymentTerms: 'Net 30 days',
            rating: 5,
            status: 'active',
            createdAt: new Date('2024-06-15').getTime(),
            updatedAt: new Date('2024-06-15').getTime(),
        },
        {
            name: 'AutoComponents Solutions',
            contactPerson: 'Priya Sharma',
            phone: '+91 11 2345 6789',
            email: 'contact@autocomponentssolutions.com',
            address: 'Sector 58, Udyog Vihar Phase IV, Gurugram, Delhi NCR - 122015',
            paymentTerms: '50% advance, 50% on delivery',
            rating: 4,
            status: 'active',
            createdAt: new Date('2024-07-01').getTime(),
            updatedAt: new Date('2024-07-01').getTime(),
        },
        {
            name: 'Premium Car Accessories',
            contactPerson: 'Arun Menon',
            phone: '+91 80 4123 5678',
            email: 'contact@premiumcaraccessories.com',
            address: 'Whitefield Industrial Estate, EPIP Zone, Whitefield, Bangalore, Karnataka - 560066',
            paymentTerms: 'Net 60 days',
            rating: 4,
            status: 'active',
            createdAt: new Date('2024-07-20').getTime(),
            updatedAt: new Date('2024-07-20').getTime(),
        },
    ];

    await db.insert(vendors).values(sampleVendors);
    
    console.log('✅ Vendors seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});