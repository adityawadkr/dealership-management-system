import { db } from '@/db';
import { employees } from '@/db/schema';

async function main() {
    const sampleEmployees = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            employeeCode: 'EMP001',
            name: 'Rajesh Kumar',
            designation: 'General Manager',
            department: 'Sales',
            branch: 'Mumbai Main Branch',
            dateOfJoining: '2020-03-15',
            employmentType: 'permanent',
            salary: 800000,
            status: 'active',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            userId: 'user_02h4kxt2e8z9y3b1n7m6q5w8r5',
            employeeCode: 'EMP002',
            name: 'Priya Sharma',
            designation: 'Sales Executive',
            department: 'Sales',
            branch: 'Mumbai Main Branch',
            dateOfJoining: '2021-07-22',
            employmentType: 'permanent',
            salary: 450000,
            status: 'active',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            userId: 'user_03h4kxt2e8z9y3b1n7m6q5w8r6',
            employeeCode: 'EMP003',
            name: 'Amit Patel',
            designation: 'Senior Technician',
            department: 'Service',
            branch: 'Mumbai Main Branch',
            dateOfJoining: '2019-11-10',
            employmentType: 'permanent',
            salary: 550000,
            status: 'active',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            userId: 'user_04h4kxt2e8z9y3b1n7m6q5w8r7',
            employeeCode: 'EMP004',
            name: 'Sneha Desai',
            designation: 'Inventory Supervisor',
            department: 'Inventory',
            branch: 'Mumbai Main Branch',
            dateOfJoining: '2022-02-18',
            employmentType: 'permanent',
            salary: 480000,
            status: 'active',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            userId: 'user_05h4kxt2e8z9y3b1n7m6q5w8r8',
            employeeCode: 'EMP005',
            name: 'Vikram Singh',
            designation: 'Customer Relations Officer',
            department: 'Customer Support',
            branch: 'Mumbai Main Branch',
            dateOfJoining: '2023-05-08',
            employmentType: 'permanent',
            salary: 420000,
            status: 'active',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
    ];

    await db.insert(employees).values(sampleEmployees);
    
    console.log('✅ Employees seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});