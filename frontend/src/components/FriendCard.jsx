import { Link } from "react-router";
import { LANGUAGE_TO_FLAG } from "../constants";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unfriend } from "../lib/api";
import { UserMinusIcon, MessageCircleIcon, BellIcon } from "lucide-react"; 

const FriendCard = ({ friend }) => {
  const queryClient = useQueryClient();
  const isOnline = friend.online;
  const lastActive = friend.last_active;
  const unreadCount = friend.unread_count || 0;

  // Unfriend Mutation
  const { mutate: unfriendMutation, isPending } = useMutation({
    mutationFn: unfriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleUnfriend = () => {
    if (window.confirm(`Are you sure you want to unfriend ${friend.fullName}?`)) {
      unfriendMutation(friend._id);
    }
  };

  return (
    <div className={`card bg-base-200 hover:shadow-md transition-all duration-300 border ${unreadCount > 0 ? 'border-primary ring-1 ring-primary shadow-lg scale-[1.01]' : 'border-base-300'}`}>
      <div className="card-body p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="avatar size-12">
              <img 
                src={friend.profilePic || "/avatar-placeholder.png"} 
                alt={friend.fullName} 
                className="rounded-full object-cover border border-base-300"
              />
            </div>
            
            {/* Online Status Dot */}
            {isOnline && (
              <span className="absolute bottom-0 right-0 size-3.5 bg-success border-2 border-base-200 rounded-full shadow-sm"></span>
            )}

            {/* NEW MESSAGE BADGE */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 badge badge-primary badge-xs py-2 px-1.5 animate-bounce font-bold shadow-sm">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex flex-col min-w-0">
            <h3 className="font-bold text-sm sm:text-base truncate tracking-tight flex items-center gap-1.5">
              {friend.fullName}
              {unreadCount > 0 && <BellIcon className="size-3 text-primary animate-pulse fill-primary" />}
            </h3>
            <p className="text-[11px] leading-none mt-1">
              {isOnline ? (
                <span className="text-success font-medium">Online</span>
              ) : (
                <span className="opacity-50">
                  {lastActive 
                    ? `Active ${formatDistanceToNow(new Date(lastActive), { addSuffix: true })}` 
                    : "Offline"}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="badge badge-secondary badge-sm py-2.5 gap-1 font-medium">
            {getLanguageFlag(friend.nativeLanguage)}
            {capitialize(friend.nativeLanguage)}
          </span>
          <span className="badge badge-outline badge-sm py-2.5 gap-1 font-medium italic">
            {getLanguageFlag(friend.learningLanguage)}
            Learning: {capitialize(friend.learningLanguage)}
          </span>
        </div>

        <div className="flex gap-2">
          <Link 
            to={`/chat/${friend._id}`} 
            className={`btn btn-sm flex-1 normal-case font-semibold tracking-wide ${unreadCount > 0 ? 'btn-primary animate-pulse' : 'btn-outline border-base-300'}`}
          >
            <MessageCircleIcon className="size-4 mr-1" />
            {unreadCount > 0 ? "New Message" : "Send Message"}
          </Link>

          {/* Unfriend Button */}
          <button 
            onClick={handleUnfriend}
            disabled={isPending}
            className="btn btn-outline btn-error btn-sm px-2"
            title="Unfriend"
          >
            {isPending ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <UserMinusIcon className="size-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendCard;

// Utils
function capitialize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getLanguageFlag(language) {
  if (!language) return null;
  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];
  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 w-auto rounded-sm inline-block shadow-sm"
      />
    );
  }
  return null;
}