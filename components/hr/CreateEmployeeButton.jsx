'use client';

import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreateEmployeeButton() {
  return (
    <Link href="/hr/create-employee">
      <Button>
        <UserPlus className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Create Employee</span>
        <span className="sm:hidden">Add</span>
      </Button>
    </Link>
  );
}

