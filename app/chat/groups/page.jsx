'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useEmployees } from '@/lib/hooks/useEmployees';

function GroupChatPageContent() {
  const { data: session } = useSession();
  const { client } = useChatContext();
  const { data: employees } = useEmployees();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    if (!session || !client) {
      setLoading(false);
      return;
    }

    async function loadGroups() {
      try {
        const filter = {
          type: 'team',
          members: { $in: [session.user.id] },
        };

        const sort = { last_message_at: -1 };
        const channels = await client.queryChannels(filter, sort, {
          watch: true,
          state: true,
        });

        setGroups(channels);
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [client, session]);

  const handleCreateGroup = async () => {
    if (!client || !session || !groupName.trim() || selectedMembers.length === 0) {
      return;
    }

    try {
      const channel = client.channel('team', undefined, {
        name: groupName,
        members: [session.user.id, ...selectedMembers],
      });

      await channel.watch();
      setIsCreateModalOpen(false);
      setGroupName('');
      setSelectedMembers([]);
      
      // Reload groups
      const filter = {
        type: 'team',
        members: { $in: [session.user.id] },
      };
      const sort = { last_message_at: -1 };
      const channels = await client.queryChannels(filter, sort, {
        watch: true,
        state: true,
      });
      setGroups(channels);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    }
  };

  const toggleMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (status === 'loading') {
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

  const availableEmployees = employees
    ? employees.filter(
        (emp) =>
          emp._id.toString() !== session.user.id && emp.status === 'active'
      )
    : [];

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Group Chats</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage team group chats
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Group Chat</DialogTitle>
              <DialogDescription>
                Create a group chat with multiple team members
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="groupName">Group Name *</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Development Team"
                />
              </div>
              <div>
                <Label>Select Members *</Label>
                <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                  {availableEmployees.map((emp) => {
                    const isSelected = selectedMembers.includes(emp._id.toString());
                    return (
                      <div
                        key={emp._id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                        onClick={() => toggleMember(emp._id.toString())}
                      >
                        <div>
                          <p className="font-medium">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-xs opacity-80">{emp.employeeId}</p>
                        </div>
                        {isSelected && <Badge>Selected</Badge>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedMembers.length === 0}
                className="w-full"
              >
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No group chats yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first group chat to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const lastMessage = group.state.messages[group.state.messages.length - 1];
            const memberCount = Object.keys(group.state.members).length;

            return (
              <Card
                key={group.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => (window.location.href = `/chat/groups/${group.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{group.data?.name || 'Unnamed Group'}</span>
                    <Badge variant="outline">{memberCount} members</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage.text || 'Attachment'}
                    </p>
                  )}
                  {group.state.unreadCount > 0 && (
                    <Badge className="mt-2">{group.state.unreadCount} new</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GroupChatPage() {
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
    return <GroupChatPageContent />;
  } catch (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
}

