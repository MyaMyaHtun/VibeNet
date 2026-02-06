import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
  getStreamToken,
} from "../lib/api";
import { Link } from "react-router";
import { CheckCircleIcon, MapPinIcon, UserPlusIcon, UsersIcon } from "lucide-react";
import { StreamChat } from "stream-chat";
import useAuthUser from "../hooks/useAuthUser";

import { capitialize } from "../lib/utils";
import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const FriendPage = () => {
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  const [chatClient, setChatClient] = useState(null);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    if (!tokenData?.token || !authUser) return;

    const client = StreamChat.getInstance(STREAM_API_KEY);

    const connectStreamUser = async () => {
      if (client.userID === authUser._id) {
        setChatClient(client);
        return;
      }

      try {
        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );
        setChatClient(client);
      } catch (error) {
        console.error("Error connecting to Stream:", error);
      }
    };

    connectStreamUser();
  }, [tokenData, authUser]);

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends", chatClient?.userID],
    queryFn: async () => {
      const backendFriends = await getUserFriends();
      
      if (!backendFriends || backendFriends.length === 0 || !chatClient) {
        return backendFriends || [];
      }

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
    },
    enabled: !!chatClient,
    refetchInterval: 5000, 
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-10">
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
      </div>
    </div>
  );
};

export default FriendPage;