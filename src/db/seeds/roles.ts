import { db } from '@/db';
import { roles } from '@/db/schema';

async function main() {
    const sampleRoles = [
        {
            name: 'Dealer Admin',
            description: 'Full system access with complete control over all modules including user management, system configuration, and all business operations',
            createdAt: Math.floor(new Date('2024-01-01').getTime() / 1000),
        },
        {
            name: 'Sales Executive',
            description: 'Manages customer relationships, leads, vehicle sales, quotations, bookings, and test drives with limited access to service and inventory modules',
            createdAt: Math.floor(new Date('2024-01-02').getTime() / 1000),
        },
        {
            name: 'Service Technician',
            description: 'Handles service appointments, job cards, diagnostics, service quotations, and maintains service history with access to spare parts inventory',
            createdAt: Math.floor(new Date('2024-01-03').getTime() / 1000),
        },
        {
            name: 'Inventory Manager',
            description: 'Manages vehicle inventory, spare parts stock, vendor relationships, purchase orders, and inventory optimization with financial oversight',
            createdAt: Math.floor(new Date('2024-01-04').getTime() / 1000),
        },
        {
            name: 'Customer Support',
            description: 'Provides customer assistance with read-only access to most data, handles inquiries, manages notifications, and tracks customer interactions',
            createdAt: Math.floor(new Date('2024-01-05').getTime() / 1000),
        }
    ];

    await db.insert(roles).values(sampleRoles);
    
    console.log('✅ Roles seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});