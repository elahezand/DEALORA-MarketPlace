export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone: string;
  body: string;
  status: "pending" | "answered";
  answer?: string | null;
  createdAt: string;
}
