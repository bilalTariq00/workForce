# Quick Start Guide - Code Examples

This guide provides practical code examples to get you started quickly.

## 1. Project Initialization

```bash
# Create Next.js project
npx create-next-app@latest workforce --typescript --tailwind --app

cd workforce

# Install core dependencies
npm install mongoose zod react-hook-form @hookform/resolvers
npm install next-auth @auth/mongodb-adapter
npm install zustand @tanstack/react-query
npm install qrcode @types/qrcode
npm install date-fns
npm install bcryptjs
npm install redis ioredis

# Install dev dependencies
npm install -D @types/bcryptjs @types/qrcode
```

## 2. MongoDB Connection

```typescript
// lib/db/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
```

## 3. Employee Model

```typescript
// lib/models/Employee.ts
import mongoose, { Schema, Model } from 'mongoose';
import { Employee as EmployeeType } from '@/types';

const EmployeeSchema = new Schema<EmployeeType>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin'],
      index: true,
    },
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      index: true,
    },
    payRate: {
      type: Number,
      required: true,
      min: 0,
    },
    bankDetails: {
      accountNumber: String,
      sortCode: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Employee: Model<EmployeeType> =
  mongoose.models.Employee || mongoose.model<EmployeeType>('Employee', EmployeeSchema);
```

## 4. Type Definitions

```typescript
// types/index.ts
export interface Employee {
  _id?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'labour' | 'site_manager' | 'contracts_manager' | 'hr_officer' | 'ehs_officer' | 'admin';
  siteId?: string;
  payRate: number;
  bankDetails?: {
    accountNumber: string;
    sortCode: string;
  };
  status: 'active' | 'inactive' | 'terminated';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Attendance {
  _id?: string;
  employeeId: string;
  siteId: string;
  signInTime: Date;
  signOutTime?: Date;
  signInMethod: 'qr' | 'barcode' | 'manual';
  signOutMethod?: 'qr' | 'barcode' | 'manual';
  hoursWorked?: number;
  status: 'present' | 'absent' | 'late';
  createdAt?: Date;
}
```

## 5. Zod Validation Schema

```typescript
// schemas/employee.ts
import { z } from 'zod';

export const employeeSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\+44\d{10}$/, 'Invalid UK phone number'),
  role: z.enum(['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin']),
  siteId: z.string().optional(),
  payRate: z.number().min(0),
  bankDetails: z.object({
    accountNumber: z.string().length(8),
    sortCode: z.string().regex(/^\d{2}-\d{2}-\d{2}$/),
  }).optional(),
});

export const signInSchema = z.object({
  siteId: z.string(),
  qrCode: z.string(),
  signInMethod: z.enum(['qr', 'barcode', 'manual']).default('qr'),
});
```

## 6. API Route Example - Sign In

```typescript
// app/api/v1/attendance/sign-in/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { signInSchema } from '@/schemas/attendance';
import { emitEvent } from '@/lib/events';

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Validate input
    const body = await req.json();
    const data = signInSchema.parse(body);

    // Connect to database
    await connectDB();

    // Check if already signed in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({
      employeeId: session.user.employeeId,
      signInTime: { $gte: today },
      signOutTime: null,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_SIGNED_IN', message: 'Already signed in today' } },
        { status: 409 }
      );
    }

    // Create attendance record
    const attendance = await Attendance.create({
      employeeId: session.user.employeeId,
      siteId: data.siteId,
      signInTime: new Date(),
      signInMethod: data.signInMethod,
      status: 'present',
    });

    // Emit event
    await emitEvent('attendance.signed_in', {
      employeeId: attendance.employeeId,
      siteId: attendance.siteId,
      signInTime: attendance.signInTime,
    });

    return NextResponse.json(
      { success: true, data: attendance },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Sign-in error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      },
      { status: 500 }
    );
  }
}
```

## 7. React Component - Sign In Form

```typescript
// components/features/attendance/SignInForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema } from '@/schemas/attendance';
import { z } from 'zod';

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      const response = await fetch('/api/v1/attendance/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        alert('Successfully signed in!');
        // Redirect or update UI
      } else {
        alert(`Error: ${result.error.message}`);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="siteId" className="block text-sm font-medium">
          Site
        </label>
        <select
          id="siteId"
          {...register('siteId')}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value="">Select site</option>
          {/* Populate from API */}
        </select>
        {errors.siteId && (
          <p className="mt-1 text-sm text-red-600">{errors.siteId.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="qrCode" className="block text-sm font-medium">
          QR Code
        </label>
        <input
          type="text"
          id="qrCode"
          {...register('qrCode')}
          className="mt-1 block w-full rounded-md border-gray-300"
          placeholder="Scan QR code or enter manually"
        />
        {errors.qrCode && (
          <p className="mt-1 text-sm text-red-600">{errors.qrCode.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

## 8. NextAuth Configuration

```typescript
// lib/auth/config.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        const employee = await Employee.findOne({ email: credentials.email });

        if (!employee) {
          return null;
        }

        // In production, hash passwords and compare
        // const isValid = await bcrypt.compare(credentials.password, employee.password);
        // For now, simple check (implement proper password hashing)

        return {
          id: employee._id.toString(),
          email: employee.email,
          name: `${employee.firstName} ${employee.lastName}`,
          role: employee.role,
          employeeId: employee.employeeId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.employeeId = user.employeeId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.employeeId = token.employeeId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};
```

## 9. Event Bus (Simple In-Memory for Phase 1)

```typescript
// lib/events/index.ts
type EventHandler = (data: any) => Promise<void> | void;

const eventHandlers: Map<string, EventHandler[]> = new Map();

export function emitEvent(eventType: string, data: any) {
  const handlers = eventHandlers.get(eventType) || [];
  handlers.forEach((handler) => {
    try {
      handler(data);
    } catch (error) {
      console.error(`Error in event handler for ${eventType}:`, error);
    }
  });
}

export function subscribe(eventType: string, handler: EventHandler) {
  if (!eventHandlers.has(eventType)) {
    eventHandlers.set(eventType, []);
  }
  eventHandlers.get(eventType)!.push(handler);
}

// Example subscription
subscribe('attendance.signed_in', async (data) => {
  // Update daily log headcount
  // Send notification
  console.log('Attendance signed in:', data);
});
```

## 10. QR Code Generation

```typescript
// lib/qr/generator.ts
import QRCode from 'qrcode';
import { Site } from '@/lib/models/Site';

export async function generateSiteQRCode(siteId: string) {
  const qrData = {
    type: 'site_signin',
    siteId,
    timestamp: Date.now(),
  };

  const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));

  // Update site with QR code
  await Site.findByIdAndUpdate(siteId, {
    qrCode: JSON.stringify(qrData),
    qrCodeImage: qrCodeDataUrl,
  });

  return qrCodeDataUrl;
}
```

## 11. Environment Variables Template

```env
# .env.local
MONGODB_URI=mongodb://localhost:27017/workforce
# or for Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/workforce

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# Optional - Redis for event bus
REDIS_URL=redis://localhost:6379

# Optional - File storage
AWS_S3_BUCKET=workforce-uploads
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## 12. Middleware for Authentication

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/v1/:path*',
  ],
};
```

## Next Steps

1. Set up the project structure
2. Create database models for all entities
3. Implement authentication
4. Build the first use case (LB-01: Sign In)
5. Test end-to-end
6. Move to next use case

See [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md) for detailed sprint planning.

