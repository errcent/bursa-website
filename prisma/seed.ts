import {
  CourseLevel,
  ChatBranchMode,
  ChatBranchSenderPolicy,
  ChatBranchVisibility,
  ChatMemberRole,
  ChatRoomKind,
  ChatRoomTier,
  Instrument,
  KycStatus,
  MessageType,
  PrismaClient,
  SignalDirection,
  SignalStatus,
  TransactionStatus,
  UserRole,
  VerificationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { courses, mentors, reviews } from "../src/lib/mock-data";
import { defaultCourseThumbnailPath } from "../src/lib/courses/thumbnails";
import type { Instrument as MockInstrument, Level } from "../src/lib/types";

const prisma = new PrismaClient();

const PASSWORD = "password123";

function mapInstrument(value: MockInstrument): Instrument {
  const map: Record<MockInstrument, Instrument> = {
    Saham: Instrument.SAHAM,
    Crypto: Instrument.CRYPTO,
    Forex: Instrument.FOREX,
  };
  return map[value];
}

function mapLevel(value: Level): CourseLevel {
  const map: Record<Level, CourseLevel> = {
    Pemula: CourseLevel.PEMULA,
    Menengah: CourseLevel.MENENGAH,
    Mahir: CourseLevel.MAHIR,
  };
  return map[value];
}

function mapTier(value: Level | "INTERNAL"): ChatRoomTier {
  if (value === "INTERNAL") return ChatRoomTier.INTERNAL;
  return mapLevel(value) as ChatRoomTier;
}

async function main() {
  console.log("Seeding database...");

  await prisma.chatMessageReaction.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatAuditLog.deleteMany();
  await prisma.tradingSignal.deleteMany();
  await prisma.tradingPoll.deleteMany();
  await prisma.chatBranchChangeRequest.deleteMany();
  await prisma.chatBranch.deleteMany();
  await prisma.chatRoomMember.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.courseChangeRequest.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.lessonQuestionLike.deleteMany();
  await prisma.lessonQuestionReply.deleteMany();
  await prisma.lessonQuestion.deleteMany();
  await prisma.note.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.playlistItem.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.contentModerationQueue.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.platformConfig.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const learner = await prisma.user.create({
    data: {
      email: "learner@test.dev",
      username: "test_learner",
      phone: "+6281110000001",
      passwordHash,
      nama: "Test Learner",
      role: UserRole.LEARNER,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  await prisma.user.create({
    data: {
      email: "demo@bursa.id",
      username: "dinda_r",
      phone: "+6281110000002",
      passwordHash,
      nama: "Dinda Ramadhani",
      role: UserRole.LEARNER,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@test.dev",
      username: "test_admin",
      phone: "+6281110000003",
      passwordHash,
      nama: "Test Admin",
      role: UserRole.ADMIN,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  const mentorUser = await prisma.user.create({
    data: {
      email: "mentor@test.dev",
      username: "test_mentor",
      phone: "+6281110000004",
      passwordHash,
      nama: "Test Mentor",
      role: UserRole.MENTOR,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  const mentorProfileMap = new Map<string, string>();

  for (const mentor of mentors) {
    const isPrimaryMentor = mentor.slug === "andra-wicaksono";
    const user = isPrimaryMentor
      ? mentorUser
      : await prisma.user.create({
          data: {
            email: `${mentor.slug}@mentor.bursa.dev`,
            username: mentor.slug.replace(/-/g, "_"),
            phone: `+62812${String(mentors.indexOf(mentor) + 1000000).slice(-7)}`,
            passwordHash,
            nama: mentor.name,
            role: UserRole.MENTOR,
            kycStatus: KycStatus.VERIFIED,
          },
        });

    const profile = await prisma.mentorProfile.create({
      data: {
        userId: user.id,
        slug: mentor.slug,
        title: mentor.title,
        initials: mentor.initials,
        avatarUrl: mentor.avatarUrl,
        bio: mentor.bio,
        philosophy: mentor.philosophy,
        spesialisasi: mentor.title,
        instruments: mentor.instruments,
        licenseLabel: mentor.licenseLabel,
        verificationStatus: mentor.verified
          ? VerificationStatus.VERIFIED
          : VerificationStatus.PENDING,
        yearsExperience: mentor.yearsExperience,
        studentsCount: mentor.studentsCount,
        coursesCount: mentor.coursesCount,
        rating: mentor.rating,
        trackRecord: mentor.trackRecord,
        availableFor1on1: mentor.availableFor1on1,
        sessionPrice: mentor.sessionPrice,
      },
    });

    mentorProfileMap.set(mentor.slug, profile.id);
  }

  for (const course of courses) {
    const mentorId = mentorProfileMap.get(course.mentorSlug);
    if (!mentorId) continue;

    const createdCourse = await prisma.course.create({
      data: {
        slug: course.slug,
        title: course.title,
        mentorId,
        instrument: mapInstrument(course.instrument),
        level: mapLevel(course.level),
        price: course.price,
        rating: course.rating,
        studentsCount: course.studentsCount,
        durationHours: course.durationHours,
        shortDescription: course.shortDescription,
        thumbnailUrl: course.thumbnailUrl ?? defaultCourseThumbnailPath(course.slug),
        outcomes: course.outcomes,
      },
    });

    for (const [moduleIndex, module] of course.modules.entries()) {
      const createdModule = await prisma.module.create({
        data: {
          courseId: createdCourse.id,
          title: module.title,
          sortOrder: moduleIndex,
        },
      });

      for (const [lessonIndex, lesson] of module.lessons.entries()) {
        await prisma.lesson.create({
          data: {
            moduleId: createdModule.id,
            legacyId: lesson.id,
            title: lesson.title,
            durationMinutes: lesson.durationMinutes,
            isPreviewGratis: lesson.preview ?? false,
            videoUrl: lesson.preview
              ? `https://cdn.bursa.dev/preview/${course.slug}/${lesson.id}.mp4`
              : null,
            sortOrder: lessonIndex,
          },
        });
      }
    }
  }

  const firstCourse = await prisma.course.findFirst({ orderBy: { createdAt: "asc" } });
  const allCourses = await prisma.course.findMany({ orderBy: { createdAt: "asc" }, take: 3 });
  const demoLearner = await prisma.user.findUnique({ where: { email: "demo@bursa.id" } });

  if (firstCourse) {
    await prisma.enrollment.create({
      data: { userId: learner.id, courseId: firstCourse.id },
    });
    await prisma.transaction.create({
      data: {
        userId: learner.id,
        courseId: firstCourse.id,
        amount: firstCourse.price,
        status: TransactionStatus.COMPLETED,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    });
    // Enrollment unlocks that mentor's community hub (wired in app via ensureHubMembership…).
    // Seed creates the membership below after rooms exist.

    // Sample revenue lines: additional enrollments + completed transactions for admin pendapatan.
    for (const [index, course] of allCourses.entries()) {
      if (index === 0) continue; // already enrolled learner on firstCourse
      await prisma.enrollment.create({
        data: { userId: learner.id, courseId: course.id },
      });
      await prisma.transaction.create({
        data: {
          userId: learner.id,
          courseId: course.id,
          amount: course.price,
          status: TransactionStatus.COMPLETED,
          createdAt: new Date(Date.now() - (index + 2) * 24 * 60 * 60 * 1000),
        },
      });
    }

    if (demoLearner && allCourses[0]) {
      const secondCourse = allCourses[1] ?? allCourses[0];
      await prisma.enrollment.create({
        data: { userId: demoLearner.id, courseId: secondCourse.id },
      });
      await prisma.transaction.create({
        data: {
          userId: demoLearner.id,
          courseId: secondCourse.id,
          amount: secondCourse.price,
          status: TransactionStatus.COMPLETED,
          createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
        },
      });
    }

    const firstModule = await prisma.module.findFirst({
      where: { courseId: firstCourse.id },
      orderBy: { sortOrder: "asc" },
      include: { lessons: { select: { id: true } } },
    });

    if (firstModule) {
      for (const lesson of firstModule.lessons) {
        await prisma.lessonProgress.create({
          data: {
            userId: learner.id,
            lessonId: lesson.id,
            completed: true,
          },
        });
      }
    }

    for (const [index, review] of reviews.entries()) {
      const reviewUser =
        index === 0
          ? learner
          : await prisma.user.create({
              data: {
                email: `reviewer${index}@test.dev`,
                username: `reviewer_${index}`,
                passwordHash,
                nama: review.name,
                role: UserRole.LEARNER,
                kycStatus: KycStatus.VERIFIED,
              },
            });

      if (index > 0 && firstModule) {
        for (const lesson of firstModule.lessons) {
          await prisma.lessonProgress.create({
            data: {
              userId: reviewUser.id,
              lessonId: lesson.id,
              completed: true,
            },
          });
        }
      }

      await prisma.review.create({
        data: {
          userId: reviewUser.id,
          courseId: firstCourse.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: new Date(Date.now() - index * 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const previewLesson = await prisma.lesson.findFirst({
      where: {
        legacyId: "l1",
        isPreviewGratis: true,
        module: { courseId: firstCourse.id },
      },
    });
    if (previewLesson) {
      const question = await prisma.lessonQuestion.create({
        data: {
          lessonId: previewLesson.id,
          userId: learner.id,
          content: "Apakah analisis fundamental tetap relevan untuk trading jangka pendek?",
          timestampSeconds: 134,
          isPinned: true,
          likeCount: 2,
        },
      });

      await prisma.lessonQuestionReply.create({
        data: {
          questionId: question.id,
          userId: mentorUser.id,
          content:
            "Ya, fundamental membantu memfilter emiten berkualitas. Untuk jangka pendek, kombinasikan dengan level teknikal dan manajemen risiko yang ketat.",
        },
      });

      await prisma.lessonQuestionLike.create({
        data: {
          questionId: question.id,
          userId: learner.id,
        },
      });

      await prisma.lessonQuestionLike.create({
        data: {
          questionId: question.id,
          userId: mentorUser.id,
        },
      });
    }
  }

  await prisma.watchlistItem.createMany({
    data: [
      {
        userId: learner.id,
        ticker: "BBCA",
        instrument: Instrument.SAHAM,
        notes: "Watchlist dari seed — emiten perbankan blue chip",
      },
      {
        userId: learner.id,
        ticker: "BTC",
        instrument: Instrument.CRYPTO,
        notes: "Monitor on-chain flow mingguan",
      },
    ],
  });

  const roomConfigs: Array<{
    slug: string;
    name: string;
    roomKind: ChatRoomKind;
    tier: ChatRoomTier;
    isProtected: boolean;
    screenshotProtection: boolean;
    memberOnly: boolean;
    description: string;
    withDefaultBranches: boolean;
  }> = [
    {
      slug: "komunitas",
      name: "Grup Mentor",
      roomKind: ChatRoomKind.MENTOR_COMMUNITY,
      tier: ChatRoomTier.PEMULA,
      isProtected: false,
      screenshotProtection: false,
      memberOnly: true,
      description:
        "Satu hub mentor dengan cabang publik (pengumuman/diskusi) dan cabang privat (internal).",
      withDefaultBranches: true,
    },
  ];

  // Platform-wide public community room (open to all users)
  const publicRoom = await prisma.chatRoom.create({
    data: {
      mentorId: null,
      slug: "komunitas-publik",
      name: "Komunitas Publik Bursa",
      description:
        "Ruang publik terbuka untuk semua anggota — diskusi umum pasar dan komunitas trading.",
      roomKind: ChatRoomKind.PUBLIC,
      tier: ChatRoomTier.PEMULA,
      isProtected: false,
      screenshotProtection: false,
      memberOnly: false,
      isActive: true,
    },
  });

  await prisma.chatRoomMember.create({
    data: {
      roomId: publicRoom.id,
      userId: learner.id,
      role: ChatMemberRole.MEMBER,
    },
  });

  await prisma.chatMessage.create({
    data: {
      roomId: publicRoom.id,
      userId: learner.id,
      content:
        "Selamat datang di komunitas publik! Silakan berdiskusi dengan sopan dan fokus pada edukasi.",
      messageType: MessageType.TEXT,
    },
  });

  for (const mentor of mentors) {
    const mentorId = mentorProfileMap.get(mentor.slug);
    if (!mentorId) continue;

    const mentorUserRecord = await prisma.user.findFirst({
      where: { mentorProfile: { id: mentorId } },
    });
    if (!mentorUserRecord) continue;

    for (const config of roomConfigs) {
      const room = await prisma.chatRoom.create({
        data: {
          mentorId,
          slug: `${config.slug}-${mentor.slug}`,
          name: `${config.name} — ${mentor.initials}`,
          description: config.description,
          roomKind: config.roomKind,
          tier: config.tier,
          isProtected: config.isProtected,
          screenshotProtection: config.screenshotProtection,
          memberOnly: config.memberOnly,
        },
      });

      await prisma.chatRoomMember.create({
        data: {
          roomId: room.id,
          userId: mentorUserRecord.id,
          role: ChatMemberRole.MENTOR,
        },
      });

      // Demo learner is enrolled in Andra's first course — only subscribe to that hub.
      // Other mentor hubs stay hidden until the learner enrolls / joins.
      if (mentor.slug === "andra-wicaksono") {
        await prisma.chatRoomMember.create({
          data: {
            roomId: room.id,
            userId: learner.id,
            role: ChatMemberRole.MEMBER,
          },
        });
      }

      let announcementBranchId: string | null = null;
      let discussionBranchId: string | null = null;
      let internalBranchId: string | null = null;

      if (config.withDefaultBranches) {
        const announcement = await prisma.chatBranch.create({
          data: {
            roomId: room.id,
            name: "Pengumuman",
            slug: "pengumuman",
            description: "Cabang publik 1 arah — hanya mentor yang mengirim.",
            mode: ChatBranchMode.ONE_WAY,
            senderPolicy: ChatBranchSenderPolicy.MENTOR_ONLY,
            visibility: ChatBranchVisibility.PUBLIC,
            sortOrder: 0,
          },
        });
        const discussion = await prisma.chatBranch.create({
          data: {
            roomId: room.id,
            name: "Diskusi",
            slug: "diskusi",
            description: "Cabang publik 2 arah — anggota dapat berbalas dengan mentor.",
            mode: ChatBranchMode.TWO_WAY,
            senderPolicy: ChatBranchSenderPolicy.MENTOR_ONLY,
            visibility: ChatBranchVisibility.PUBLIC,
            sortOrder: 1,
          },
        });
        const internal = await prisma.chatBranch.create({
          data: {
            roomId: room.id,
            name: "Internal",
            slug: "internal",
            description: "Cabang privat — hanya mentor dan moderator.",
            mode: ChatBranchMode.ONE_WAY,
            senderPolicy: ChatBranchSenderPolicy.MENTOR_AND_MODERATORS,
            visibility: ChatBranchVisibility.PRIVATE,
            sortOrder: 2,
          },
        });
        announcementBranchId = announcement.id;
        discussionBranchId = discussion.id;
        internalBranchId = internal.id;
      }

      await prisma.chatMessage.create({
        data: {
          roomId: room.id,
          branchId: announcementBranchId,
          userId: mentorUserRecord.id,
          content: `Selamat datang di ${room.name}! Mari belajar dengan disiplin dan manajemen risiko.`,
          messageType: MessageType.ANNOUNCEMENT,
          isPinned: true,
        },
      });

      if (announcementBranchId) {
        const signal = await prisma.tradingSignal.create({
          data: {
            roomId: room.id,
            mentorId,
            ticker: mentor.instruments.includes("Saham") ? "BBCA" : "BTC",
            instrument: mapInstrument(mentor.instruments[0]),
            direction: SignalDirection.LONG,
            entryPrice: mentor.instruments.includes("Saham") ? 10250 : 68500,
            targetPrice: mentor.instruments.includes("Saham") ? 10800 : 72000,
            stopLoss: mentor.instruments.includes("Saham") ? 9950 : 66000,
            rationale: "Setup berdasarkan analisis fundamental dan momentum jangka menengah.",
            status: SignalStatus.ACTIVE,
          },
        });

        await prisma.chatMessage.create({
          data: {
            roomId: room.id,
            branchId: announcementBranchId,
            userId: mentorUserRecord.id,
            content: `Sinyal baru: ${signal.ticker} — ${signal.direction}`,
            messageType: MessageType.SIGNAL,
            metadata: {
              signalId: signal.id,
              ticker: signal.ticker,
              direction: signal.direction,
              instrument: signal.instrument,
              entryPrice: signal.entryPrice,
              targetPrice: signal.targetPrice,
              stopLoss: signal.stopLoss,
              rationale: signal.rationale,
            },
          },
        });
      }

      if (discussionBranchId) {
        const discussionAuthorId =
          mentor.slug === "andra-wicaksono" ? learner.id : mentorUserRecord.id;
        await prisma.chatMessage.create({
          data: {
            roomId: room.id,
            branchId: discussionBranchId,
            userId: discussionAuthorId,
            content:
              mentor.slug === "andra-wicaksono"
                ? "Terima kasih mentor, materi dan diskusinya sangat membantu!"
                : "Silakan gunakan cabang diskusi untuk bertanya setelah bergabung.",
            messageType: MessageType.TEXT,
          },
        });
      }

      if (internalBranchId) {
        await prisma.chatMessage.create({
          data: {
            roomId: room.id,
            branchId: internalBranchId,
            userId: mentorUserRecord.id,
            content:
              "Catatan internal mentor: review progress cohort minggu ini sebelum sesi live.",
            messageType: MessageType.TEXT,
          },
        });
      }
    }
  }

  // Per-mentor admin collaboration rooms (staff; does not count toward hub limit)
  const mentorProfilesForCollab = await prisma.mentorProfile.findMany({
    include: { user: { select: { id: true, nama: true } } },
    orderBy: { createdAt: "asc" },
  });
  for (const mp of mentorProfilesForCollab) {
    const collabRoom = await prisma.chatRoom.create({
      data: {
        mentorId: mp.id,
        slug: `mentor-admin-${mp.slug}`,
        name: `Admin · ${mp.user.nama}`,
        description:
          "Ruang privat antara mentor ini dan admin untuk koordinasi kurikulum dan operasional.",
        roomKind: ChatRoomKind.MENTOR_INTERNAL,
        tier: ChatRoomTier.INTERNAL,
        isProtected: true,
        screenshotProtection: true,
        memberOnly: true,
        isStaffCollaboration: true,
        isActive: true,
      },
    });
    await prisma.chatRoomMember.create({
      data: {
        roomId: collabRoom.id,
        userId: mp.userId,
        role: ChatMemberRole.MENTOR,
      },
    });
    await prisma.chatRoomMember.create({
      data: {
        roomId: collabRoom.id,
        userId: admin.id,
        role: ChatMemberRole.MODERATOR,
      },
    });
    await prisma.chatMessage.create({
      data: {
        roomId: collabRoom.id,
        userId: admin.id,
        content:
          "Selamat datang di ruang kolaborasi privat dengan admin. Diskusikan usulan kurikulum di sini.",
        messageType: MessageType.ANNOUNCEMENT,
        isPinned: true,
      },
    });
  }

  await prisma.platformConfig.createMany({
    data: [
      { key: "maintenance_mode", value: { enabled: false } },
      { key: "max_chat_rooms_per_mentor", value: { limit: 10 } },
      { key: "screenshot_protection_default", value: { enabled: true } },
    ],
  });

  await prisma.contentModerationQueue.create({
    data: {
      contentType: "chat_message",
      contentId: "sample-message-id",
      reportedBy: learner.id,
      reason: "Konten promosi tidak relevan",
      status: "PENDING",
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: "SEED_DATABASE",
      entityType: "platform",
      entityId: "seed",
      changes: { note: "Initial seed from mock-data.ts" },
      ipAddress: "127.0.0.1",
    },
  });

  async function findLessonByCourseAndLegacy(courseSlug: string, legacyId: string) {
    return prisma.lesson.findFirst({
      where: {
        legacyId,
        module: { course: { slug: courseSlug } },
      },
      select: { id: true },
    });
  }

  const mentalLessons = await Promise.all([
    findLessonByCourseAndLegacy("manajemen-risiko-crypto-pemula", "l1"),
    findLessonByCourseAndLegacy("manajemen-risiko-crypto-pemula", "l4"),
    findLessonByCourseAndLegacy("swing-trading-teknikal-dasar", "l4"),
    findLessonByCourseAndLegacy("fundamental-saham-untuk-pemula", "l1"),
    findLessonByCourseAndLegacy("forex-makro-dasar", "l1"),
  ]);

  const mentalLessonIds = mentalLessons.filter(Boolean).map((lesson) => lesson!.id);

  if (mentalLessonIds.length > 0) {
    await prisma.playlist.create({
      data: {
        userId: admin.id,
        title: "Kesehatan Mental Trading",
        description:
          "Kurasi modul psikologi, disiplin, dan mindset dari lima mentor berbeda.",
        slug: "kesehatan-mental-trading",
        isCurated: true,
        isPublished: true,
        items: {
          create: mentalLessonIds.map((lessonId, index) => ({
            lessonId,
            sortOrder: index,
          })),
        },
      },
    });
  }

  const fundasiLessons = await Promise.all([
    findLessonByCourseAndLegacy("fundamental-saham-untuk-pemula", "l1"),
    findLessonByCourseAndLegacy("fundamental-saham-untuk-pemula", "l4"),
    findLessonByCourseAndLegacy("membaca-laporan-keuangan-lanjutan", "l1"),
  ]);

  const fundasiLessonIds = fundasiLessons.filter(Boolean).map((lesson) => lesson!.id);

  if (fundasiLessonIds.length > 0) {
    await prisma.playlist.create({
      data: {
        userId: admin.id,
        title: "Fundasi Analisis Saham",
        description: "Tiga pelajaran pembuka untuk memahami fundamental dan valuasi.",
        slug: "fundasi-analisis-saham",
        isCurated: true,
        isPublished: true,
        items: {
          create: fundasiLessonIds.map((lessonId, index) => ({
            lessonId,
            sortOrder: index,
          })),
        },
      },
    });
  }

  // Sample 1-on-1 availability slots for mentors with availableFor1on1
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@test.dev" } });
  const slotOffsets = [2, 3, 5, 7, 10];
  const slotTimes = [
    { start: 10, end: 10, endMin: 45 },
    { start: 14, end: 14, endMin: 45 },
    { start: 19, end: 19, endMin: 30 },
  ];

  for (const mentor of mentors) {
    if (!mentor.availableFor1on1) continue;
    const mentorId = mentorProfileMap.get(mentor.slug);
    if (!mentorId) continue;

    for (let i = 0; i < 3; i++) {
      const dayOffset = slotOffsets[i];
      const time = slotTimes[i];
      const startAt = new Date();
      startAt.setDate(startAt.getDate() + dayOffset);
      startAt.setUTCHours(time.start - 7, 0, 0, 0);
      const endAt = new Date(startAt);
      endAt.setUTCHours(time.end - 7, time.endMin, 0, 0);

      await prisma.mentorAvailabilitySlot.create({
        data: {
          mentorId,
          startAt,
          endAt,
          notes: i === 0 ? "Via Zoom — link dikirim setelah booking" : null,
          createdByAdminId: adminUser?.id ?? null,
        },
      });
    }
  }

  console.log("Seed completed.");
  console.log("Test accounts (password: password123):");
  console.log("  learner@test.dev  | username: test_learner  | phone: +6281110000001");
  console.log("  demo@bursa.id     | username: dinda_r       | phone: +6281110000002 (password: demo1234)");
  console.log("  mentor@test.dev   | username: test_mentor   | phone: +6281110000004");
  console.log("  admin@test.dev    | username: test_admin    | phone: +6281110000003");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
