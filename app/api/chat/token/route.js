import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { StreamChat } from 'stream-chat';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';

const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY,
  process.env.STREAM_SECRET
);

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get employee details from MongoDB
    const employee = await Employee.findById(session.user.id).select('-password');

    if (!employee) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = employee._id.toString();
    const userName = `${employee.firstName} ${employee.lastName}`;

    // Create Stream token
    const token = serverClient.createToken(userId);

    // Sync user to Stream (upsert - creates or updates)
    // Note: role field removed - Stream Chat requires roles to be predefined in dashboard
    // We store role in custom field (employeeId) instead
    await serverClient.upsertUser({
      id: userId,
      name: userName,
      email: employee.email,
      // role: employee.role, // Removed - not defined in Stream Chat dashboard
      employeeId: employee.employeeId,
      userRole: employee.role, // Store as custom field instead
      image: undefined, // Add avatar URL if you have it
    });

    return NextResponse.json({ 
      token,
      user: {
        id: userId,
        name: userName,
        email: employee.email,
        role: employee.role,
        employeeId: employee.employeeId,
      }
    });
  } catch (error) {
    console.error('Error generating Stream token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token', message: error.message },
      { status: 500 }
    );
  }
}

