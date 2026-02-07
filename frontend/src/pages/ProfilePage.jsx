import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CameraIcon, Loader2, MapPinIcon, UserIcon } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import { updateProfile } from "../lib/api";
import { capitialize } from "../lib/utils";

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();

  // Form State
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
    location: authUser?.location || "",
  });

  const [selectedImg, setSelectedImg] = useState(null);

  const { mutate: updateProfileMutation, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      alert("Profile updated successfully! ✅");
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Something went wrong");
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation({ ...formData, profilePic: selectedImg });
  };

  return (
    <div className="min-h-screen pt-10 pb-20 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-base-200 rounded-xl p-6 shadow-lg border border-base-300">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className="text-base-content/60">Update your personal information</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img
                  src={selectedImg || authUser?.profilePic || "/avatar-placeholder.png"}
                  alt="Profile"
                  className="size-32 rounded-full object-cover border-4 border-primary/20"
                />
                <label
                  htmlFor="avatar-upload"
                  className={`
                    absolute bottom-0 right-0 
                    bg-primary hover:scale-105
                    p-2 rounded-full cursor-pointer 
                    transition-all duration-200
                    ${isPending ? "animate-pulse pointer-events-none" : ""}
                  `}
                >
                  <CameraIcon className="w-5 h-5 text-primary-content" />
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isPending}
                  />
                </label>
              </div>
              <p className="text-xs text-base-content/40">
                Click the camera icon to update your photo
              </p>
            </div>

            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase opacity-70">Full Name</label>
                <input
                  type="text"
                  className="input input-bordered focus:input-primary"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase opacity-70">Location</label>
                <div className="relative">
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10 focus:input-primary"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Yangon, Myanmar"
                  />
                  <MapPinIcon className="absolute left-3 top-3 size-5 opacity-40" />
                </div>
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase opacity-70">Native Language</label>
                <input
                  type="text"
                  className="input input-bordered focus:input-primary"
                  value={formData.nativeLanguage}
                  onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
                  placeholder="Burmese"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase opacity-70">Learning Language</label>
                <input
                  type="text"
                  className="input input-bordered focus:input-primary"
                  value={formData.learningLanguage}
                  onChange={(e) => setFormData({ ...formData, learningLanguage: e.target.value })}
                  placeholder="English"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold uppercase opacity-70">Bio</label>
              <textarea
                className="textarea textarea-bordered h-24 focus:textarea-primary"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-5 animate-spin mr-2" /> Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        </div>

        {/* Account Info Section (Read Only) */}
        <div className="bg-base-200 rounded-xl p-6 border border-base-300">
          <h2 className="text-lg font-bold mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-base-300">
              <span className="opacity-60">Member Since</span>
              <span>{authUser?.createdAt?.split("T")[0]}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-base-300">
              <span className="opacity-60">Account Email</span>
              <span>{authUser?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="opacity-60">Account Status</span>
              <span className="text-success font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;