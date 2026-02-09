import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, UserIcon, PhoneIncoming } from "lucide-react"; 
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import { StreamChat } from "stream-chat";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname?.startsWith("/chat");
  const { logoutMutation } = useLogout();
  const [incomingCall, setIncomingCall] = useState(null);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    if (!authUser || !tokenData?.token) return;
    const client = StreamChat.getInstance(STREAM_API_KEY);
    
    const setupListener = async () => {
      if (!client.userID) {
        await client.connectUser({ id: authUser._id, name: authUser.fullName, image: "" }, tokenData.token);
      }
      client.on((event) => {
        if (event.type === "video-call" && event.user?.id !== authUser._id) {
          setIncomingCall(event.callId);
        }
      });
    };

    setupListener();
  }, [authUser, tokenData]);

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end w-full">
          {isChatPage && (
            <div className="pl-5">
              <Link to="/" className="flex items-center gap-2.5">
                <img src="/logo.svg" alt="Streamify Logo" className="size-10 object-contain" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                  VibeNet
                </span>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <Link to={"/notifications"}>
              <button className="btn btn-ghost btn-circle">
                <BellIcon className="h-6 w-6 text-base-content opacity-70" />
              </button>
            </Link>
          </div>

          <ThemeSelector />
          <div className="px-2">
            <Link to="/profile" className="flex items-center">
              <div className="avatar transition-transform hover:scale-105">
                <div className="w-10 h-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-300 text-center flex items-center justify-center">
                  {authUser?.profilePic ? (
                    <img src={authUser.profilePic} alt="User Avatar" className="object-cover w-full h-full" />
                  ) : (
                    <UserIcon className="w-6 h-6 opacity-50" />
                  )}
                </div>
              </div>
            </Link>
          </div>

          <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
            <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
          </button>
        </div>
      </div>

      {incomingCall && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
          <div className="bg-base-100 p-8 rounded-3xl text-center shadow-2xl border-2 border-primary w-80 animate-in zoom-in">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full animate-pulse">
                <PhoneIncoming className="size-10 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Incoming Call</h2>
            <p className="opacity-60 mb-6 text-sm italic">Someone is calling you...</p>

            <div className="flex gap-4">
              <button 
                className="btn btn-error btn-sm flex-1 rounded-xl" 
                onClick={() => setIncomingCall(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary btn-sm flex-1 rounded-xl shadow-lg" 
                onClick={() => {
                  const id = incomingCall;
                  setIncomingCall(null);
                  navigate(`/call/${id}`);
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
export default Navbar;