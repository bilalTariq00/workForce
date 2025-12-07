'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEmployees } from '@/lib/hooks/useEmployees';

function ChatPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const chatContext = useChatContext();
  const client = chatContext?.client;
  
  const { data: employees, isLoading } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);

  // If client is not available, show message
  if (!client) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing chat connection...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (status === 'loading' || !session || !client) {
      if (status !== 'loading' && !client) {
        setLoadingChannels(false);
      }
      return;
    }

    async function loadChannels() {
      try {
        // Get user's channels (conversations)
        const filter = {
          type: 'messaging',
          members: { $in: [session.user.id] },
        };

        const sort = { last_message_at: -1 };

        const channelsResponse = await client.queryChannels(filter, sort, {
          watch: true,
          state: true,
        });

        setChannels(channelsResponse);
      } catch (error) {
        console.error('Error loading channels:', error);
      } finally {
        setLoadingChannels(false);
      }
    }

    loadChannels();
  }, [client, session, status]);

  const handleStartChat = async (employeeId) => {
    if (!client || !session) {
      console.error('Client or session not available');
      return;
    }

    try {
      // Create or get existing 1-1 channel
      const channelId = [session.user.id, employeeId].sort().join('-');
      const channel = client.channel('messaging', channelId, {
        members: [session.user.id, employeeId],
      });

      await channel.watch();

      // Navigate to chat using Next.js router
      router.push(`/chat/${employeeId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat: ' + (error.message || 'Unknown error'));
    }
  };


  const filteredEmployees = employees
    ? employees.filter(
        (emp) =>
          emp._id.toString() !== session.user.id &&
          emp.status === 'active' &&
          (emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-2">
          Chat with your team members in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Conversations */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Chats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingChannels ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : channels.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No conversations yet. Start a chat below!
                </p>
              ) : (
                <div className="space-y-2">
                  {channels.map((channel) => {
                    const otherMembers = channel.state.members;
                    const otherMember = Object.values(otherMembers).find(
                      (m) => m.user?.id !== session.user.id
                    );
                    const lastMessage = channel.state.messages[channel.state.messages.length - 1];

                    return (
                      <Link
                        key={channel.id}
                        href={`/chat/${otherMember?.user?.id || channel.id}`}
                        className="block p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {otherMember?.user?.name || 'Unknown User'}
                            </p>
                            {lastMessage && (
                              <p className="text-sm text-muted-foreground truncate">
                                {lastMessage.text || 'Attachment'}
                              </p>
                            )}
                          </div>
                          {channel.state.unreadCount > 0 && (
                            <Badge variant="default" className="ml-2">
                              {channel.state.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Start New Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No employees found
                    </p>
                  ) : (
                    filteredEmployees.map((employee) => {
                      const roleLabel = employee.role
                        ?.split('_')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ') || employee.role;

                      return (
                        <div
                          key={employee._id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {roleLabel}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {employee.employeeId}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleStartChat(employee._id.toString())}
                          >
                            Message
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
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

  return <ChatPageContent />;
}

