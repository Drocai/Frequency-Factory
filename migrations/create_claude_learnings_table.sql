-- Create Claude Learnings table for persistent knowledge base
CREATE TABLE IF NOT EXISTS `claudeLearnings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `problem` TEXT NOT NULL,
  `solution` TEXT NOT NULL,
  `prevention` TEXT,
  `severity` ENUM('info', 'warning', 'error', 'critical') NOT NULL DEFAULT 'info',
  `resolved` INT DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed: First learning - branch protection on main
INSERT INTO `claudeLearnings` (`category`, `title`, `problem`, `solution`, `prevention`, `severity`, `resolved`)
VALUES (
  'git',
  'Cannot push directly to main - branch protection enabled',
  'Running `git push origin main` returns HTTP 403 error. The GitHub repository has branch protection rules that prevent direct pushes to the main branch, even for authenticated users. Error: "RPC failed; HTTP 403 curl 22 The requested URL returned error: 403".',
  'Merge into main via Pull Request on GitHub instead of direct push. Steps: (1) Push feature branch with `git push -u origin <branch-name>`, (2) Create PR via GitHub UI or `gh pr create`, (3) Merge the PR through GitHub which bypasses branch protection for authorized merges.',
  'Never attempt `git push origin main` directly. Always use the PR workflow: push to feature branch -> create PR -> merge via GitHub. This is a permanent repo setting and the correct Git workflow for collaborative projects.',
  'error',
  1
);
