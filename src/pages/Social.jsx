import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Users, Plus, Trophy, TrendingUp, Target, Search, UserPlus, Check, X } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatDate } from '@/utils/helpers';

export default function Social() {
  const { user, userStats } = useStore();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
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
      // Load friends: query only docs where user is involved (user1 or user2) to respect security rules
      const friendsQ1 = query(collection(db, 'friends'), where('user1', '==', user.uid));
      const friendsQ2 = query(collection(db, 'friends'), where('user2', '==', user.uid));
      const [friendsSnap1, friendsSnap2] = await Promise.all([getDocs(friendsQ1), getDocs(friendsQ2)]);
      const friendMap = new Map();
      friendsSnap1.docs.concat(friendsSnap2.docs).forEach(d => {
        const data = d.data();
        // only include accepted friendships
        if (data.status === 'accepted') friendMap.set(d.id, { id: d.id, ...data });
      });
      const myFriends = Array.from(friendMap.values());

      // Load friend requests: query by user2 then filter status client-side to avoid composite index
      const requestsQuery = query(
        collection(db, 'friends'),
        where('user2', '==', user.uid)
      );
      const requestsSnap = await getDocs(requestsQuery);
      const requests = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(r => r.status === 'pending');

      // Load leaderboard (top users by points)
      let leaderboardData = [];
      try {
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('points', 'desc'),
          limit(20)
        );
        const usersSnap = await getDocs(usersQuery);
        leaderboardData = usersSnap.docs.map((doc, index) => ({
          rank: index + 1,
          uid: doc.id,
          ...doc.data()
        }));
      } catch (err) {
        // Permission denied for listing users is possible; degrade gracefully
        console.warn('Could not load leaderboard:', err);
        leaderboardData = [];
      }

      // Load activity feed (may be permission-restricted)
      let activities = [];
      try {
        const activitiesQuery = query(
          collection(db, 'activities'),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        const activitiesSnap = await getDocs(activitiesQuery);
        activities = activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (err) {
        console.warn('Could not load activity feed:', err);
        activities = [];
      }

      setFriends(myFriends);
      setFriendRequests(requests);
      setLeaderboard(leaderboardData);
      setActivityFeed(activities);
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

      // Check if friendship already exists by querying only relevant docs (avoid listing entire collection)
      const existingQ1 = query(collection(db, 'friends'), where('user1', '==', user.uid));
      const existingSnap1 = await getDocs(existingQ1);
      const exists1 = existingSnap1.docs.some(d => {
        const data = d.data();
        return data.user2 === targetUser.id;
      });

      const existingQ2 = query(collection(db, 'friends'), where('user1', '==', targetUser.id));
      const existingSnap2 = await getDocs(existingQ2);
      const exists2 = existingSnap2.docs.some(d => {
        const data = d.data();
        return data.user2 === user.uid;
      });

      const exists = exists1 || exists2;

      if (exists) {
        toast.error('Friend request already sent or you are already friends');
        return;
      }

      await addDoc(collection(db, 'friends'), {
        user1: user.uid,
        user1Name: user.displayName,
        user2: targetUser.id,
        user2Name: targetUser.data().displayName,
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

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-amber-400';
    if (rank === 2) return 'text-slate-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-slate-400';
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Social</h1>
            <p className="text-slate-400">Connect with friends and compete on leaderboards</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <p className="text-sm text-slate-400 mb-1">Your Rank</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {leaderboard.findIndex(u => u.uid === user.uid) + 1 || '-'}
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
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Friend Requests</h2>
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

        {/* Tabs */}
        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-white/5">
            <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="friends" data-testid="tab-friends">Friends</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity Feed</TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Top Performers</h2>
              <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {leaderboard.map((userData, index) => (
                    <div
                      key={userData.uid}
                      data-testid={`leaderboard-rank-${index + 1}`}
                      className={`p-4 flex items-center gap-4 ${
                        userData.uid === user.uid ? 'bg-violet-500/10 border-l-4 border-violet-500' : 'hover:bg-white/5'
                      } transition-colors`}
                    >
                      <div className={`text-3xl font-bold ${getRankColor(index + 1)} w-12 text-center`}>
                        {getRankBadge(index + 1)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">
                          {userData.displayName || 'Student'}
                          {userData.uid === user.uid && <span className="ml-2 text-xs text-violet-400">(You)</span>}
                        </p>
                        <p className="text-xs text-slate-500">Level {userData.level || 1}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {userData.points || 0}
                        </p>
                        <p className="text-xs text-slate-500">XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="friends">
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Your Friends</h2>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map(friendship => {
                    const friendId = friendship.user1 === user.uid ? friendship.user2 : friendship.user1;
                    const friendName = friendship.user1 === user.uid ? friendship.user2Name : friendship.user1Name;
                    const friendData = leaderboard.find(u => u.uid === friendId);
                    
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
          </TabsContent>

          <TabsContent value="activity">
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Activity</h2>
              {activityFeed.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl">
                  <TrendingUp className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-slate-400">No activity yet</h3>
                  <p className="text-slate-500">Friend activities will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityFeed.map(activity => (
                    <div
                      key={activity.id}
                      data-testid={`activity-${activity.id}`}
                      className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 hover:border-violet-500/30 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {activity.userName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold">{activity.userName}</span>{' '}
                            <span className="text-slate-400">{activity.action}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{formatDate(activity.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}