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
            console.error('Missing credentials');
            return null;
          }

          console.log('Attempting login for:', credentials.email);

          await connectDB();

          const employee = await Employee.findOne({ 
            email: credentials.email.toLowerCase(),
            status: 'active'
          });

          if (!employee) {
            console.error('Employee not found or inactive:', credentials.email);
            return null;
          }

          console.log('Employee found:', employee.email, employee.role);

          const isValid = await bcrypt.compare(credentials.password, employee.password);

          if (!isValid) {
            console.error('Invalid password for:', credentials.email);
            return null;
          }

          console.log('Login successful for:', credentials.email);

          return {
            id: employee._id.toString(),
            email: employee.email,
            name: `${employee.firstName} ${employee.lastName}`,
            role: employee.role,
            employeeId: employee.employeeId,
          };
        } catch (error) {
          console.error('Auth error:', error);
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.employeeId = token.employeeId;
        session.user.id = token.id;
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
  debug: process.env.NODE_ENV === 'development', // Enable debug in development
};

