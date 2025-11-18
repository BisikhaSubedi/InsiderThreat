const express = require("express");
const router = express.Router();
const { requireAuth, hasScopes } = require("../middleware/auth");
const { sendEmailAndLog } = require("../utils/sendEmailSmtp"); // add at top of file
const articleDB = require("../db/article");
const generateId = require("../utils/utils");

// List articles
router.get("/articles", requireAuth(["list:articles"]), async (req, res) => {
  try {
    // If user has list:articles scope, return all articles
    if (hasScopes(req.user.scopes, ["list:articles"])) {
      const articles = await articleDB.list();
      return res.json(articles);
    }

    // Otherwise, return only user's articles
    const articles = await articleDB.listByOwner(req.user.id);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

// Get article by ID
router.get(
  "/articles/:id",
  requireAuth(["read:articles"]),
  async (req, res) => {
    try {
      const article = await articleDB.getById(req.params.id);

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      // If user has read:articles scope or is the owner, allow access
      if (
        hasScopes(req.user.scopes, ["read:articles"]) ||
        article.ownerId === req.user.id
      ) {
        return res.json(article);
      }

      return res.status(403).json({ error: "Access denied" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  }
);

// Create article
router.post("/articles", requireAuth(["create:articles"]), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const article = {
      id: generateId(),
      ownerId: req.user.id,
      title,
      content,
      createdAt: new Date().toISOString(),
      isPublished: false,
    };

    const created = await articleDB.create(article);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: "Failed to create article" });
  }
});

// Update article
router.patch(
  "/articles/:id/published",
  requireAuth(["publish:articles"]),
  async (req, res) => {
    try {
      const article = await articleDB.getById(req.params.id);

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      // flip published status
      const updated = await articleDB.update(req.params.id, {
        isPublished: !article.isPublished,
      });

      // If it was just published (i.e., new status is true) -> send email
      if (updated && updated.isPublished) {
        // Compose email
        const from = process.env.EMAIL_FROM || "no-reply@example.com";
        // recipient(s) - example: admin or author; adjust as needed
        const to = [
          { address: process.env.NOTIFY_EMAIL || "admin@example.com" },
        ];

        const subject = `Article published: ${updated.title}`;
        const html = `
          <p>User <strong>${
            req.user?.id || "unknown"
          }</strong> published an article.</p>
          <p><strong>${updated.title}</strong></p>
          <p>${(updated.content || "").slice(0, 300)}...</p>
          <p><a href="${
            process.env.APP_URL || "http://localhost:5173"
          }/articles/${updated.id}">View article</a></p>
        `;

        // send and log (await to know the result). If you prefer async background, remove await.
        const emailResult = await sendEmailAndLog({ from, to, subject, html });

        if (!emailResult.ok) {
          console.error(
            "Email sending failed for article publish:",
            emailResult.error
          );
          // You can still return success for publish but include email failure info
          return res
            .status(200)
            .json({ article: updated, email: { ok: false } });
        }
      }

      return res.json(updated);
    } catch (error) {
      console.error("Failed to update article status:", error);
      return res.status(500).json({ error: "Failed to update article status" });
    }
  }
);

// Delete article
router.delete(
  "/articles/:id",
  requireAuth(["delete:articles"]),
  async (req, res) => {
    try {
      const article = await articleDB.getById(req.params.id);

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      if (article.ownerId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await articleDB.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete article" });
    }
  }
);

module.exports = router;
