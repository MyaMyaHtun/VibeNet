import { Link } from "react-router";
import { LANGUAGE_TO_FLAG } from "../constants";
import { formatDistanceToNow } from "date-fns";

const FriendCard = ({ friend }) => {
  const isOnline = friend.online;
  const lastActive = friend.last_active;

  return (
    <div className="card bg-base-200 hover:shadow-md transition-all duration-300 border border-base-300">
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
            {isOnline && (
              <span className="absolute bottom-0 right-0 size-3.5 bg-success border-2 border-base-200 rounded-full shadow-sm"></span>
            )}
          </div>
          
          <div className="flex flex-col min-w-0">
            <h3 className="font-bold text-sm sm:text-base truncate tracking-tight">
              {friend.fullName}
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
            Native: {friend.nativeLanguage}
          </span>
          <span className="badge badge-outline badge-sm py-2.5 gap-1 font-medium italic">
            {getLanguageFlag(friend.learningLanguage)}
            Learning: {friend.learningLanguage}
          </span>
        </div>

        <Link 
          to={`/chat/${friend._id}`} 
          className="btn btn-primary btn-sm w-full normal-case font-semibold tracking-wide"
        >
          Message
        </Link>
      </div>
    </div>
  );
};

export default FriendCard;

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