import type { Metadata } from "next";
import CreateShopForm from "@/components/createShop/CreateShopForm";

export const metadata: Metadata = {
  title: "Open Your Shop",
  description: "Create your store on Dealora and start selling to buyers near you.",
};

export default function CreateShopPage() {
  return <CreateShopForm />;
}
