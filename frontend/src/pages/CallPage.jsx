import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import { StreamVideo, StreamVideoClient, StreamCall, CallControls, SpeakerLayout, StreamTheme, CallingState, useCallStateHooks } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const { authUser, isLoading: userLoading } = useAuthUser();
  const isInitializing = useRef(false);
  const navigate = useNavigate();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    if (!tokenData?.token || !authUser || !callId || client || isInitializing.current) return;

    const initCall = async () => {
      isInitializing.current = true;
      try {
        const safeImage = authUser.profilePic?.startsWith("data:") ? "" : authUser.profilePic;
        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: { id: authUser._id, name: authUser.fullName, image: safeImage },
          token: tokenData.token,
        });

        const callInstance = videoClient.call("default", callId);
        await callInstance.join({ create: true });

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        toast.error("Could not join call.");
        navigate("/");
      } finally {
        isInitializing.current = false;
      }
    };
    initCall();

    return () => { if (client) client.disconnectUser(); };
  }, [tokenData, authUser, callId]);

  if (userLoading || !client || !call) return <PageLoader />;

  return (
    <div className="h-screen w-full bg-black">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <CallContent />
        </StreamCall>
      </StreamVideo>
    </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();

  useEffect(() => {
    if (callingState === CallingState.LEFT) navigate("/");
  }, [callingState]);

  return (
    <StreamTheme>
      <div className="h-screen flex flex-col relative overflow-hidden">
        <SpeakerLayout />
        <div className="absolute bottom-10 w-full flex justify-center">
            <CallControls onLeave={() => navigate("/")} />
        </div>
      </div>
    </StreamTheme>
  );
};
export default CallPage;