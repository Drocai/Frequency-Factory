CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`submissionId` int NOT NULL,
	`userName` varchar(255),
	`userAvatar` varchar(64),
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`submissionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`submissionId` int NOT NULL,
	`hookStrength` int NOT NULL,
	`originality` int NOT NULL,
	`productionQuality` int NOT NULL,
	`overallScore` int NOT NULL,
	`wasAccurate` int DEFAULT 0,
	`tokensAwarded` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`artistName` varchar(255) NOT NULL,
	`trackTitle` varchar(255) NOT NULL,
	`email` varchar(320),
	`bestTimestamp` varchar(10),
	`streamingLink` varchar(512),
	`genre` varchar(64),
	`aiAssisted` varchar(10) DEFAULT 'no',
	`notes` text,
	`platform` varchar(32),
	`status` enum('pending','processing','approved','rejected') DEFAULT 'pending',
	`ticketNumber` varchar(20),
	`queuePosition` int,
	`plays` int DEFAULT 0,
	`likes` int DEFAULT 0,
	`commentsCount` int DEFAULT 0,
	`avgHookStrength` int DEFAULT 0,
	`avgOriginality` int DEFAULT 0,
	`avgProductionQuality` int DEFAULT 0,
	`totalCertifications` int DEFAULT 0,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tokenTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('signup_bonus','submit_track','prediction','comment','daily_login','skip_queue','referral','admin_grant','admin_deduct') NOT NULL,
	`referenceId` int,
	`description` text,
	`balanceAfter` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tokenTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `tokenBalance` int DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarId` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarName` varchar(64) DEFAULT 'BeatMaster';--> statement-breakpoint
ALTER TABLE `users` ADD `hasCompletedOnboarding` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `totalTokensEarned` int DEFAULT 50;--> statement-breakpoint
ALTER TABLE `users` ADD `totalPredictions` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `accuratePredictions` int DEFAULT 0;