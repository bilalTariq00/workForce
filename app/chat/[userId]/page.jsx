'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useChatContext } from 'stream-chat-react';
import {
  Channel,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from 'stream-chat-react';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function ChatDetailPageContent() {
  const { data: session, status } = useSession();
  const chatContext = useChatContext();
  const client = chatContext?.client;
  
  const params = useParams();
  const userId = params.userId;
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // If client is not available, show loading
  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Initializing chat connection...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (status === 'loading' || !session || !client) {
      if (status !== 'loading') {
        setLoading(false);
      }
      return;
    }

    async function setupChannel() {
      try {
        // Create or get existing 1-1 messaging channel
        const channelId = [session.user.id, userId].sort().join('-');
        
        const newChannel = client.channel('messaging', channelId, {
          members: [session.user.id, userId],
        });

        await newChannel.watch();
        setChannel(newChannel);
      } catch (err) {
        console.error('Error setting up channel:', err);
        setError('Failed to load chat');
      } finally {
        setLoading(false);
      }
    }

    setupChannel();
  }, [client, session, userId, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const router = useRouter();
  
  if (!session) {
    router.push('/login');
    return null;
  }

  if (error || !channel) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-6">
          <p className="text-red-600 mb-4">{error || 'Chat not found'}</p>
          <Link href="/chat">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Messages
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b bg-background p-4">
        <Link href="/chat">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>
      <div className="flex-1 overflow-hidden">
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </div>
    </div>
  );
}

export default function ChatDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return <ChatDetailPageContent />;
}

