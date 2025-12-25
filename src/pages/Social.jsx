import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Users, Plus, Trophy, TrendingUp, Target, Search, UserPlus, Check, X } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatDate } from '@/utils/helpers';

export default function Social() {
  const { user, userStats } = useStore();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendsDetails, setFriendsDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);

  useEffect(() => {
    if (user) {
      loadSocialData();
    }
  }, [user]);

  const loadSocialData = async () => {
    try {
      // Load friends where user is involved
      const friendsQ1 = query(collection(db, 'friends'), where('user1', '==', user.uid), where('status', '==', 'accepted'));
      const friendsQ2 = query(collection(db, 'friends'), where('user2', '==', user.uid), where('status', '==', 'accepted'));
      
      const [friendsSnap1, friendsSnap2] = await Promise.all([getDocs(friendsQ1), getDocs(friendsQ2)]);
      
      const friendMap = new Map();
      friendsSnap1.docs.concat(friendsSnap2.docs).forEach(d => {
        friendMap.set(d.id, { id: d.id, ...d.data() });
      });
      
      const myFriends = Array.from(friendMap.values());
      setFriends(myFriends);

      // Load friend details
      const friendIds = myFriends.map(f => 
        f.user1 === user.uid ? f.user2 : f.user1
      );
      
      const friendDetailsPromises = friendIds.map(async (friendId) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', friendId));
          if (userDoc.exists()) {
            return { uid: friendId, ...userDoc.data() };
          }
          return null;
        } catch (error) {
          console.warn('Could not load friend details:', friendId);
          return null;
        }
      });
      
      const details = await Promise.all(friendDetailsPromises);
      setFriendsDetails(details.filter(Boolean));

      // Load friend requests
      const requestsQuery = query(
        collection(db, 'friends'),
        where('user2', '==', user.uid),
        where('status', '==', 'pending')
      );
      const requestsSnap = await getDocs(requestsQuery);
      const requests = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFriendRequests(requests);

    } catch (error) {
      console.error('Error loading social data:', error);
      toast.error('Failed to load social data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (e) => {
    e.preventDefault();
    try {
      // Find user by email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', searchEmail)
      );
      const usersSnap = await getDocs(usersQuery);
      
      if (usersSnap.empty) {
        toast.error('User not found');
        return;
      }

      const targetUser = usersSnap.docs[0];
      if (targetUser.id === user.uid) {
        toast.error("You can't add yourself as a friend");
        return;
      }

      // Check if friendship already exists
      const existingQ1 = query(
        collection(db, 'friends'), 
        where('user1', '==', user.uid),
        where('user2', '==', targetUser.id)
      );
      const existingQ2 = query(
        collection(db, 'friends'), 
        where('user1', '==', targetUser.id),
        where('user2', '==', user.uid)
      );

      const [existingSnap1, existingSnap2] = await Promise.all([
        getDocs(existingQ1),
        getDocs(existingQ2)
      ]);

      if (!existingSnap1.empty || !existingSnap2.empty) {
        toast.error('Friend request already sent or you are already friends');
        return;
      }

      await addDoc(collection(db, 'friends'), {
        user1: user.uid,
        user1Name: user.displayName || user.email,
        user2: targetUser.id,
        user2Name: (targetUser.data().displayName || targetUser.data().email || 'Unknown'),
        status: 'pending',
        createdDate: new Date().toISOString()
      });

      toast.success('Friend request sent!');
      setShowAddFriend(false);
      setSearchEmail('');
      loadSocialData();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const requestRef = doc(db, 'friends', requestId);
      await updateDoc(requestRef, { status: 'accepted' });
      toast.success('Friend request accepted!');
      loadSocialData();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const requestRef = doc(db, 'friends', requestId);
      await updateDoc(requestRef, { status: 'rejected' });
      toast.success('Friend request rejected');
      loadSocialData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Social</h1>
            <p className="text-sm sm:text-base text-slate-400">Connect with friends and track progress together</p>
          </div>
          <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-friend-button"
                className="bg-violet-600 hover:bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-slate-200">Add Friend</DialogTitle>
                <DialogDescription className="sr-only">
                  Search for users by email to send friend requests
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendFriendRequest} className="space-y-4">
                <div>
                  <Input
                    data-testid="friend-email-input"
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    required
                    placeholder="friend@example.com"
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-500">
                  <Search className="w-4 h-4 mr-2" />
                  Send Request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Friends</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{friends.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Your Level</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {userStats.level}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Requests</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{friendRequests.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-pink-500 flex items-center justify-center shadow-lg">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Friend Requests</h2>
            <div className="space-y-3">
              {friendRequests.map(request => (
                <div
                  key={request.id}
                  data-testid={`friend-request-${request.id}`}
                  className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                      {request.user1Name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold">{request.user1Name}</p>
                      <p className="text-xs text-slate-500">wants to be friends</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRequest(request.id)}
                      className="bg-emerald-600 hover:bg-emerald-500"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                      className="border-white/10 hover:bg-rose-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Your Friends</h2>
          {friends.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl">
              <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-400">No friends yet</h3>
              <p className="text-slate-500 mb-6">Add friends to compete and motivate each other</p>
              <Button onClick={() => setShowAddFriend(true)} className="bg-violet-600 hover:bg-violet-500">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Your First Friend
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {friends.map(friendship => {
                const friendId = friendship.user1 === user.uid ? friendship.user2 : friendship.user1;
                const friendName = friendship.user1 === user.uid ? friendship.user2Name : friendship.user1Name;
                const friendData = friendsDetails.find(f => f.uid === friendId);
                
                return (
                  <div
                    key={friendship.id}
                    data-testid={`friend-${friendship.id}`}
                    className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-violet-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xl font-semibold">
                        {friendName?.charAt(0) || 'F'}
                      </div>
                      <div>
                        <p className="font-semibold">{friendName}</p>
                        <p className="text-xs text-slate-500">Level {friendData?.level || 1}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-xs text-slate-400">Points</span>
                      <span className="text-lg font-bold text-amber-400">{friendData?.points || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}