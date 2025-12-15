import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('[AUTH] Missing credentials');
            return null;
          }

          console.log('[AUTH] Attempting login for:', credentials.email);

          // Check if NEXTAUTH_SECRET is set
          if (!process.env.NEXTAUTH_SECRET) {
            console.error('[AUTH] NEXTAUTH_SECRET is not set - check environment variables');
            return null;
          }

          // Connect to database
          try {
            await connectDB();
            console.log('[AUTH] Database connected');
          } catch (dbError) {
            console.error('[AUTH] Database connection error:', dbError.message);
            return null;
          }

          // Find employee
          const employee = await Employee.findOne({ 
            email: credentials.email.toLowerCase(),
            status: 'active'
          });

          if (!employee) {
            console.error('[AUTH] Employee not found or inactive:', credentials.email);
            return null;
          }

          console.log('[AUTH] Employee found:', employee.email, employee.role);

          // Verify password
          if (!employee.password) {
            console.error('[AUTH] Employee has no password set');
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, employee.password);

          if (!isValid) {
            console.error('[AUTH] Invalid password for:', credentials.email);
            return null;
          }

          console.log('[AUTH] Login successful for:', credentials.email);

          // Populate role template for session
          await employee.populate('roleTemplateId', 'name permissions');

          return {
            id: employee._id.toString(),
            email: employee.email,
            name: `${employee.firstName} ${employee.lastName}`,
            role: employee.role,
            employeeId: employee.employeeId,
            purchasedModules: employee.purchasedModules || [],
            roleTemplateId: employee.roleTemplateId ? {
              _id: employee.roleTemplateId._id.toString(),
              name: employee.roleTemplateId.name,
              permissions: employee.roleTemplateId.permissions,
            } : null,
          };
        } catch (error) {
          console.error('[AUTH] Auth error:', error.message, error.stack);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.employeeId = user.employeeId;
        token.id = user.id;
        token.purchasedModules = user.purchasedModules || [];
        token.roleTemplateId = user.roleTemplateId || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.employeeId = token.employeeId;
        session.user.id = token.id;
        session.user.purchasedModules = token.purchasedModules || [];
        session.user.roleTemplateId = token.roleTemplateId || null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development' || process.env.NEXTAUTH_DEBUG === 'true',
  trustHost: true, // Required for Vercel and other serverless platforms
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? undefined : undefined, // Let browser set domain
      },
    },
  },
};

