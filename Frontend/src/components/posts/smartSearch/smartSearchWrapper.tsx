"use client";
import { useState } from "react";
import { toast } from "sonner";
import SmartSearch from "./SmartSearch";
import DetailSearchModal from "./detailSearchModal";
import { ListingProps } from "@/types/Listings";
import { findSmartPostMatch } from "@/services/aiSearch";
export default function SmartSearchContainer() {
  const [selectedPost, setSelectedPost] = useState<ListingProps | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchReason, setSearchReason] = useState("");

  const handleSmartSearch = async (prompt: string, budget?: number) => {
    try {
      const matchResult = await findSmartPostMatch({ userInput: prompt, budget });

      if (!matchResult._id) {
        toast.error(matchResult.reason || "No matching listing found.");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${baseUrl}/listings/${matchResult._id}`);
      const postData = await res.json();

      if (!res.ok || !postData.data) {
        toast.error("Listing details could not be found.");
        return;
      }

      setSelectedPost(postData.data);
      setSearchReason(matchResult.reason);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Smart Search Error:", err);
      toast.error("An error occurred during smart search.");
    }
  };

  return (
    <>
      <SmartSearch
       onSearchSubmit={handleSmartSearch} />
      <DetailSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        post={selectedPost}
        reason={searchReason}
      />
    </>
  );
}