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

function GroupChatDetailPageContent() {
  const { data: session } = useSession();
  const { client } = useChatContext();
  const params = useParams();
  const groupId = params.groupId;
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session || !client) {
      setLoading(false);
      return;
    }

    async function setupChannel() {
      try {
        const channel = client.channel('team', groupId);
        await channel.watch();
        setChannel(channel);
      } catch (err) {
        console.error('Error setting up channel:', err);
        setError('Failed to load group chat');
      } finally {
        setLoading(false);
      }
    }

    setupChannel();
  }, [client, session, groupId, status]);

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
  
  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-6">
          <p className="text-red-600 mb-4">{error || 'Group chat not found'}</p>
          <Link href="/chat/groups">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Groups
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b bg-background p-4">
        <Link href="/chat/groups">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
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

export default function GroupChatDetailPage() {
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

  try {
    return <GroupChatDetailPageContent />;
  } catch (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
}

