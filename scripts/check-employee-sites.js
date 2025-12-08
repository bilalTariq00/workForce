/**
 * Quick script to check if employees have site assignments
 * Run: node scripts/check-employee-sites.js
 */

import dotenv from 'dotenv';
import { connectDB } from '../lib/db/mongodb.js';
import { Employee } from '../lib/models/Employee.js';
import { EmployeeSite } from '../lib/models/EmployeeSite.js';

dotenv.config({ path: '.env.local' });

async function checkEmployeeSites() {
  try {
    await connectDB();
    console.log('Connected to database\n');

    // Get all employees
    const employees = await Employee.find({ status: { $ne: 'terminated' } })
      .select('firstName lastName employeeId')
      .lean();

    console.log(`Total Employees: ${employees.length}\n`);

    // Check site assignments for each employee
    let employeesWithSites = 0;
    let totalAssignments = 0;

    for (const employee of employees) {
      const assignedSites = await EmployeeSite.getEmployeeSites(employee._id);
      if (assignedSites && assignedSites.length > 0) {
        employeesWithSites++;
        totalAssignments += assignedSites.length;
        console.log(`${employee.firstName} ${employee.lastName} (${employee.employeeId}):`);
        assignedSites.forEach((assignment) => {
          const site = assignment.siteId;
          const siteName = typeof site === 'object' && site !== null 
            ? (site.name || site.siteCode || 'Unknown')
            : 'Unknown';
          console.log(`  - ${siteName} (${assignment.isPrimary ? 'Primary' : 'Secondary'})`);
        });
        console.log('');
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Employees with site assignments: ${employeesWithSites}/${employees.length}`);
    console.log(`Total site assignments: ${totalAssignments}`);

    if (employeesWithSites === 0) {
      console.log('\n⚠️  No employees have site assignments yet!');
      console.log('To assign sites:');
      console.log('1. Go to /hr/employees');
      console.log('2. Click "Edit" on an employee');
      console.log('3. Add sites in "Assign to Sites" section');
      console.log('4. Save');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEmployeeSites();

