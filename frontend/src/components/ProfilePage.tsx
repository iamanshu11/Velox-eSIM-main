"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import useAuth from "@/hooks/useAuth";
import { uploadService } from "@/services/uploadService";
import { useToast } from "@/components/ToastProvider";
import apiClient from "@/lib/apiClient";
import Image from "next/image";

type TabType = "account" | "security";

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("account");
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setAvatarPreview(user.avatar || "");
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      await updateProfile({ name });
      addToast("Profile updated successfully.", "success");
    } catch (err: any) {
      addToast(err?.message || "Profile update failed.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addToast("Please select a valid image file.", "error");
      return;
    }

    setAvatarFile(file);
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      addToast("Choose an image before uploading.", "error");
      return;
    }

    setUploadingAvatar(true);

    try {
      const uploadResult = await uploadService.uploadProfilePicture(avatarFile);
      const avatarUrl = uploadResult.url || (uploadResult as any).fileUrl;

      if (!avatarUrl) {
        throw new Error("Upload returned an invalid image URL.");
      }

      await updateProfile({ avatar: avatarUrl });
      addToast("Avatar uploaded successfully.", "success");
      setAvatarFile(null);
      setAvatarPreview(avatarUrl);
    } catch (err: any) {
      addToast(err?.message || "Failed to upload avatar.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setSavingPassword(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast("Passwords do not match.", "error");
      setSavingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      addToast("Password must be at least 8 characters.", "error");
      setSavingPassword(false);
      return;
    }

    try {
      const response = await apiClient.post<{
        success: boolean;
        message?: string;
      }>("/auth/change-password", {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Password change failed.");
      }

      addToast("Password changed successfully.", "success");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      addToast(err?.message || "Failed to change password.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <ProtectedRoute type="protected">
      <main className="bg-neutral-50 py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-4xl border border-neutral-200 bg-white shadow-[0_18px_60px_-32px_rgba(15,23,42,0.18)]">
            {/* Header */}
            <div className="bg-linear-to-r from-primary-700 via-primary-600 to-primary-500 px-6 py-5 sm:px-8 sm:py-5">
              <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_35%)]" />
              <div className="relative">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-100">
                  Profile
                </p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Your account, elevated.
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-100/90">
                  Update your profile and keep your account secure with
                  dedicated sections for each setting.
                </p>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">
                    Role
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {user?.role || "Member"}
                  </p>
                </div>
                <div className="rounded-3xl bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">
                    Email
                  </p>
                  <p className="mt-3 truncate text-lg font-semibold text-white">
                    {user?.email || "Not available"}
                  </p>
                </div>
                <div className="rounded-3xl bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">
                    Status
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    Protected
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-neutral-200/70 bg-neutral-50 px-4 py-4 sm:px-6">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab("account")}
                  className={`rounded-t-2xl px-6 py-3 font-semibold transition ${
                    activeTab === "account"
                      ? "bg-white text-primary-700 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  Account Settings
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`rounded-t-2xl px-6 py-3 font-semibold transition ${
                    activeTab === "security"
                      ? "bg-white text-primary-700 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  Security
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="border-t border-neutral-200/70 bg-white px-4 py-6 sm:px-6">
              {/* Account Settings Tab */}
              {activeTab === "account" && (
                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                  {/* Avatar Section */}
                  <section className="rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white">
                        {avatarPreview ? (
                          <Image
                            src={avatarPreview}
                            alt="Profile avatar"
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl font-semibold text-neutral-700">
                            {user?.name?.[0]?.toUpperCase() ||
                              user?.email?.[0]?.toUpperCase() ||
                              "U"}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-neutral-900">
                          Profile picture
                        </p>
                        <p className="text-sm text-neutral-500">
                          Upload a high-definition avatar to personalize your
                          account.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleAvatarSelect}
                        className="w-full rounded-3xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 file:mr-4 file:rounded-full file:border-0 file:bg-primary-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-800"
                      />
                      <button
                        type="button"
                        onClick={handleAvatarUpload}
                        disabled={uploadingAvatar || !avatarFile}
                        className="w-full rounded-3xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/10 transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {uploadingAvatar ? "Uploading..." : "Upload photo"}
                      </button>
                    </div>
                  </section>

                  {/* Profile Details Section */}
                  <section className="rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
                          Account
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
                          Profile details
                        </h2>
                      </div>
                      <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-700">
                        Core
                      </span>
                    </div>
                    <form
                      onSubmit={handleProfileSubmit}
                      className="mt-4 space-y-4"
                    >
                      <div>
                        <label className="text-sm font-semibold text-neutral-900">
                          Full name
                        </label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-2 w-full rounded-3xl border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
                          placeholder="Your name"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="inline-flex items-center justify-center rounded-3xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/10 transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingProfile ? "Saving..." : "Save profile"}
                      </button>
                    </form>
                  </section>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <section className="mx-auto max-w-2xl rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
                        Security
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
                        Change password
                      </h2>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-700">
                      Private
                    </span>
                  </div>
                  <form
                    onSubmit={handleChangePassword}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <label className="text-sm font-semibold text-neutral-900">
                        Current password
                      </label>
                      <div className="relative mt-2">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full rounded-3xl border border-neutral-200 bg-white px-3 py-2.5 pr-12 text-neutral-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
                          placeholder="Current password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center text-neutral-500"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-900">
                        New password
                      </label>
                      <div className="relative mt-2">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full rounded-3xl border border-neutral-200 bg-white px-3 py-2.5 pr-12 text-neutral-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
                          placeholder="New password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center text-neutral-500"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-900">
                        Confirm password
                      </label>
                      <div className="relative mt-2">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full rounded-3xl border border-neutral-200 bg-white px-3 py-2.5 pr-12 text-neutral-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center text-neutral-500"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="inline-flex items-center justify-center rounded-3xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/10 transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingPassword ? "Saving..." : "Update password"}
                    </button>
                  </form>
                </section>
              )}
            </div>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
};

export default ProfilePage;
