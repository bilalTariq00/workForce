'use client';

import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function StreamChatProvider({ children }) {
  const { data: session, status } = useSession();
  const [chatClient, setChatClient] = useState(null);
  const [loading, setLoading] = useState(false); // Start as false, only set true when initializing chat
  const [mounted, setMounted] = useState(false);

  // Ensure we're on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') {
      return;
    }
    
    // If no session, don't initialize chat - render children immediately
    if (!session?.user) {
      setLoading(false);
      return;
    }

    // Only set loading to true when we actually have a session and are initializing
    setLoading(true);

    let clientInstance = null;

    async function setupChat() {
      try {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_KEY;
        if (!apiKey) {
          console.error('Stream API key not found');
          setLoading(false);
          return;
        }

        // Initialize Stream Chat client
        clientInstance = StreamChat.getInstance(apiKey);

        // Get token from backend
        const response = await fetch('/api/chat/token', {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to get chat token');
        }

        const { token, user } = await response.json();

        // Connect user to Stream
        // Note: role field removed - Stream Chat requires roles to be predefined
        await clientInstance.connectUser(
          {
            id: user.id,
            name: user.name,
            email: user.email,
            // role: user.role, // Removed - not defined in Stream Chat dashboard
            employeeId: user.employeeId,
            userRole: user.role, // Store as custom field instead
          },
          token
        );

        setChatClient(clientInstance);
      } catch (error) {
        console.error('Error setting up Stream Chat:', error);
        // Don't block the app if chat fails - just log the error
        // User can still use the app without chat functionality
        setChatClient(null);
      } finally {
        setLoading(false);
      }
    }

    setupChat();

    // Cleanup on unmount
    return () => {
      if (clientInstance) {
        clientInstance.disconnectUser().catch(console.error);
      }
    };
  }, [session, status]);

  // On initial render (server-side), always render children to match server HTML
  if (!mounted) {
    return <>{children}</>;
  }

  // If no session, render children without chat immediately (no loading)
  if (!session?.user || status === 'unauthenticated') {
    return <>{children}</>;
  }

  // Show loading state only when we're actually initializing chat (have session but no client yet)
  if (loading && status !== 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Initializing chat...</p>
        </div>
      </div>
    );
  }

  // While session is loading, show children (don't block the page)
  if (status === 'loading') {
    return <>{children}</>;
  }

  // Only wrap with Chat provider when client is ready
  // Chat component requires a non-null client
  // If chat failed to initialize, just render children without chat
  if (!chatClient && loading) {
    // Still show loading if we're waiting for client
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Initializing chat...</p>
        </div>
      </div>
    );
  }

  // If chat client failed to initialize, render children without chat
  if (!chatClient) {
    return <>{children}</>;
  }

  // Wrap children with Stream Chat provider
  return (
    <Chat client={chatClient} theme="str-chat__theme-light">
      {children}
    </Chat>
  );
}

