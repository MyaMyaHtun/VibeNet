import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
  getStreamToken,
  cancelFriendRequest 
} from "../lib/api";
import { Link } from "react-router";
import { 
  MapPinIcon, 
  UserPlusIcon, 
  UsersIcon, 
  XCircleIcon
} from "lucide-react";
import { StreamChat } from "stream-chat";
import useAuthUser from "../hooks/useAuthUser";

import { capitialize } from "../lib/utils";
import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const HomePage = () => {
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());
  const [chatClient, setChatClient] = useState(null);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken", authUser?._id],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });
  useEffect(() => {
    if (!tokenData?.token || !authUser?._id) return;

    const client = StreamChat.getInstance(STREAM_API_KEY);

    const connectStreamUser = async () => {
      try {
        if (client.userID === authUser._id) {
          setChatClient(client);
          return;
        }

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic?.startsWith("http") ? authUser.profilePic : "",
          },
          tokenData.token
        );
        setChatClient(client);
        console.log("VibeNet: Stream Connected Successfully");
      } catch (error) {
        console.error("VibeNet: Stream Connection Error:", error);
      }
    };

    connectStreamUser();

    return () => {
    };
  }, [tokenData, authUser]);
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends", authUser?._id, chatClient?.userID], 
    queryFn: async () => {
      const backendFriends = await getUserFriends();
      if (!backendFriends || backendFriends.length === 0 || !chatClient) {
        return backendFriends || [];
      }

      try {
        const friendIds = backendFriends.map((f) => f._id);
        const response = await chatClient.queryUsers({ id: { $in: friendIds } });
        
        return backendFriends.map((f) => {
          const streamUser = response.users.find((u) => u.id === f._id);
          return {
            ...f,
            online: streamUser?.online || false, 
            last_active: streamUser?.last_active,
          };
        });
      } catch (err) {
        console.warn("Could not fetch online status, showing raw friends:", err);
        return backendFriends;
      }
    },
    refetchInterval: 5000,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users", authUser?._id], 
    queryFn: getRecommendedUsers,
    enabled: !!authUser,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs", authUser?._id],
    queryFn: getOutgoingFriendReqs,
    enabled: !!authUser,
  });

  const { mutate: sendRequestMutation, isPending: isSending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    },
  });

  const { mutate: cancelRequestMutation, isPending: isCancelling } = useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    },
  });

  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendReqs) {
      outgoingFriendReqs.forEach((req) => {
        if (req.recipient?._id) outgoingIds.add(req.recipient._id);
      });
      setOutgoingRequestsIds(outgoingIds);
    }
  }, [outgoingFriendReqs]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-base-100">
      <div className="container mx-auto space-y-10">
        
        {/* SECTION 1: FRIENDS LIST */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Friends</h2>
          <Link to="/notifications" className="btn btn-outline btn-sm">
            <UsersIcon className="mr-2 size-4" />
            Friend Requests
          </Link>
        </div>

        {loadingFriends ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {friends.map((friend) => (
              <FriendCard key={friend._id} friend={friend} />
            ))}
          </div>
        )}

        {/* SECTION 2: RECOMMENDATIONS */}
        <section className="pt-10 border-t border-base-300">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Meet New Learners</h2>
            <p className="opacity-70 italic">Discover partners based on your profile and languages</p>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-secondary" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="card bg-base-200 p-10 text-center border border-dashed border-base-300">
              <h3 className="font-semibold text-lg mb-2">No recommendations available</h3>
              <p className="opacity-60">Update your profile or check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedUsers.map((user) => {
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);
                const isProcessing = isSending || isCancelling;

                return (
                  <div key={user._id} className="card bg-base-200 hover:shadow-xl transition-all duration-300 border border-base-300 group">
                    <div className="card-body p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar size-16">
                          <img 
                            src={user.profilePic || "/avatar-placeholder.png"} 
                            alt={user.fullName} 
                            className="rounded-full object-cover ring ring-base-300 ring-offset-base-100" 
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                            {user.fullName}
                          </h3>
                          {user.location && (
                            <div className="flex items-center text-xs opacity-70 mt-1">
                              <MapPinIcon className="size-3 mr-1" />
                              {user.location}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge badge-secondary badge-sm py-2.5 gap-1">
                          {getLanguageFlag(user.nativeLanguage)}
                          {capitialize(user.nativeLanguage)}
                        </span>
                        <span className="badge badge-outline badge-sm py-2.5 gap-1">
                          {getLanguageFlag(user.learningLanguage)}
                          Learning: {capitialize(user.learningLanguage)}
                        </span>
                      </div>
                      
                      {user.bio && <p className="text-sm opacity-70 line-clamp-2 italic">"{user.bio}"</p>}
                      
                      <button
                        className={`btn w-full mt-2 transition-all ${
                          hasRequestBeenSent 
                            ? "btn-outline btn-error hover:scale-[1.02]" 
                            : "btn-primary hover:scale-[1.02]"
                        }`}
                        onClick={() => {
                          if (hasRequestBeenSent) {
                            cancelRequestMutation(user._id);
                          } else {
                            sendRequestMutation(user._id);
                          }
                        }}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : hasRequestBeenSent ? (
                          <>
                            <XCircleIcon className="size-4 mr-2" />
                            Cancel Request
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="size-4 mr-2" />
                            Friend Request
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;