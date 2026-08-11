import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChatRoomPageClient } from "@/components/chat/chat-room-page-client";
import { findChatRoomBySlug, listActiveChatRooms } from "@/lib/chat/db-rooms";
import { KOMUNITAS_ENABLED } from "@/lib/features/komunitas";
import { getRoomBySlug, mockRooms } from "@/lib/chat/mock-chat-data";

interface RoomPageProps {
  params: Promise<{ roomSlug: string }>;
  searchParams: Promise<{ mentorId?: string }>;
}

export async function generateMetadata({ params, searchParams }: RoomPageProps): Promise<Metadata> {
  const { roomSlug } = await params;
  const { mentorId } = await searchParams;
  const dbRoom = await findChatRoomBySlug(roomSlug, mentorId).catch(() => null);
  const room = dbRoom ?? getRoomBySlug(roomSlug);
  if (!room) return { title: "Ruang Tidak Ditemukan" };
  return {
    title: room.name,
    description: room.description,
  };
}

export function generateStaticParams() {
  return mockRooms.map((room) => ({ roomSlug: room.slug }));
}

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  if (!KOMUNITAS_ENABLED) notFound();

  const { roomSlug } = await params;
  const { mentorId } = await searchParams;

  const dbRoom = await findChatRoomBySlug(roomSlug, mentorId).catch(() => null);
  const room = dbRoom ?? getRoomBySlug(roomSlug);
  if (!room) notFound();

  const sidebarRooms = await listActiveChatRooms().catch(() => mockRooms);

  return <ChatRoomPageClient room={room} sidebarRooms={sidebarRooms} />;
}
