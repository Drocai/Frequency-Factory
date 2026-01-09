ALTER TABLE `users` ADD `lastDailyBonusDate` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `loginStreak` int DEFAULT 0;